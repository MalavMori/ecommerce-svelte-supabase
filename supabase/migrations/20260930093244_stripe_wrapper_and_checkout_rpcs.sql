-- ============================================
-- STRIPE FOREIGN DATA WRAPPER & FOREIGN TABLES
-- ============================================

-- Ensure wrappers extension is enabled
create extension if not exists wrappers with schema extensions;

-- Create Stripe FDW if it doesn't already exist
do $$
begin
  if not exists (select 1 from pg_foreign_data_wrapper where fdwname = 'stripe_wrapper') then
    create foreign data wrapper stripe_wrapper
      handler extensions.stripe_fdw_handler
      validator extensions.stripe_fdw_validator;
  end if;
end $$;

-- Create stripe_server if not exists
do $$
begin
  if not exists (select 1 from pg_foreign_server where srvname = 'stripe_server') then
    create server stripe_server
      foreign data wrapper stripe_wrapper
      options (
        api_key 'sk_test_placeholder'
      );
  end if;
end $$;

-- Create stripe schema for foreign tables
create schema if not exists stripe;

create foreign table if not exists stripe.payment_intents (
  id text,
  customer text,
  amount bigint,
  currency text,
  status text,
  description text,
  created bigint,
  attrs jsonb
)
server stripe_server
options (
  object 'payment_intents'
);

create foreign table if not exists stripe.charges (
  id text,
  customer text,
  amount bigint,
  currency text,
  status text,
  payment_intent text,
  created bigint,
  attrs jsonb
)
server stripe_server
options (
  object 'charges'
);

create foreign table if not exists stripe.refunds (
  id text,
  charge text,
  payment_intent text,
  amount bigint,
  currency text,
  status text,
  created bigint,
  attrs jsonb
)
server stripe_server
options (
  object 'refunds'
);

create foreign table if not exists stripe.customers (
  id text,
  email text,
  name text,
  description text,
  created bigint,
  attrs jsonb
)
server stripe_server
options (
  object 'customers'
);

-- ============================================
-- CONSOLIDATED CHECKOUT RPCs (Cloudflare Edge Optimized)
-- Single network round-trip for atomic operations
-- ============================================

-- 1. Create Pending Checkout Order RPC
create or replace function create_pending_checkout_order(
  p_user_id uuid,
  p_address_id uuid,
  p_coupon_code text default null,
  p_display_currency text default 'INR'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_address_id uuid;
  v_subtotal numeric(10,2) := 0;
  v_discount_amount numeric(10,2) := 0;
  v_shipping_amount numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_coupon record;
  v_coupon_id uuid := null;
  v_discount_val numeric;
  v_order_id uuid;
  v_display_total numeric(10,2);
  v_cart_count int;
  v_item record;
  v_unit_price numeric(10,2);
  v_line_total numeric(10,2);
  v_variant_label text;
begin
  -- Validate user
  if p_user_id is null then
    raise exception 'Unauthorized: user_id is required';
  end if;

  -- Validate address exists and belongs to user
  select id into v_address_id
  from addresses
  where id = p_address_id and user_id = p_user_id;

  if v_address_id is null then
    raise exception 'Invalid shipping address';
  end if;

  -- Check cart has items
  select count(*) into v_cart_count
  from cart_items
  where user_id = p_user_id;

  if v_cart_count = 0 then
    raise exception 'Cart is empty';
  end if;

  -- Validate stock and compute subtotal
  for v_item in (
    select
      ci.id as cart_item_id,
      ci.quantity,
      ci.product_id,
      ci.variant_id,
      p.name as product_name,
      p.price as product_price,
      p.stock_quantity as product_stock,
      p.is_active as product_active,
      pv.price as variant_price,
      pv.stock_quantity as variant_stock,
      pv.is_active as variant_active,
      (
        select string_agg(
          case
            when po.name is not null and pov.value is not null then po.name || ': ' || pov.value
            else pov.value
          end,
          ', '
        )
        from variant_option_values vov
        join product_option_values pov on pov.id = vov.option_value_id
        join product_options po on po.id = pov.option_id
        where vov.variant_id = coalesce(ci.variant_id, pv.id)
      ) as computed_variant_label
    from cart_items ci
    join products p on p.id = ci.product_id
    left join product_variants pv on pv.id = ci.variant_id
    where ci.user_id = p_user_id
  ) loop
    -- Active checks
    if not v_item.product_active or (v_item.variant_active is not null and not v_item.variant_active) then
      raise exception 'Product "%" is no longer available', v_item.product_name;
    end if;

    -- Stock check
    if v_item.variant_id is not null then
      if coalesce(v_item.variant_stock, 0) < v_item.quantity then
        raise exception 'Insufficient stock for "%" (only % available)', v_item.product_name, coalesce(v_item.variant_stock, 0);
      end if;
      v_unit_price := coalesce(effective_price(v_item.variant_id), v_item.variant_price);
    else
      if coalesce(v_item.product_stock, 0) < v_item.quantity then
        raise exception 'Insufficient stock for "%" (only % available)', v_item.product_name, coalesce(v_item.product_stock, 0);
      end if;
      v_unit_price := v_item.product_price;
    end if;

    v_line_total := round(v_unit_price * v_item.quantity, 2);
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  v_subtotal := round(v_subtotal, 2);

  -- Coupon handling
  if p_coupon_code is not null and trim(p_coupon_code) <> '' and v_subtotal > 0 then
    select * into v_coupon
    from coupons
    where code = upper(trim(p_coupon_code))
      and is_active = true;

    if v_coupon.id is null then
      raise exception 'Coupon code "%" is invalid or inactive', p_coupon_code;
    elsif v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception 'Coupon code "%" has expired', p_coupon_code;
    elsif v_coupon.max_uses is not null and coalesce(v_coupon.used_count, 0) >= v_coupon.max_uses then
      raise exception 'Coupon code "%" has reached its usage limit', p_coupon_code;
    elsif v_coupon.min_order_amount is not null and v_subtotal < v_coupon.min_order_amount then
      raise exception 'Minimum order amount of % required for coupon "%"', v_coupon.min_order_amount, p_coupon_code;
    else
      v_coupon_id := v_coupon.id;
      v_discount_val := v_coupon.discount_value;
      if v_coupon.discount_type = 'percentage' then
        v_discount_amount := round(v_subtotal * (v_discount_val / 100.0), 2);
      else
        v_discount_amount := least(v_subtotal, v_discount_val);
      end if;
    end if;
  end if;

  -- Shipping calculation
  v_shipping_amount := case when v_subtotal >= 100 then 0.00 else 15.00 end;

  -- Total (must strictly equal subtotal - discount + shipping for trigger trg_validate_order_total)
  v_total := round(v_subtotal - v_discount_amount + v_shipping_amount, 2);

  -- Multi-currency snapshot display total
  if p_display_currency is not null and p_display_currency <> '' then
    v_display_total := convert_price(v_total, p_display_currency);
  else
    v_display_total := v_total;
  end if;

  -- Insert order in pending state (stock NOT decremented until payment succeeds!)
  insert into orders (
    user_id,
    address_id,
    coupon_id,
    status,
    payment_status,
    subtotal,
    discount_amount,
    shipping_amount,
    total,
    display_currency_code,
    display_total
  ) values (
    p_user_id,
    v_address_id,
    v_coupon_id,
    'pending',
    'unpaid',
    v_subtotal,
    v_discount_amount,
    v_shipping_amount,
    v_total,
    coalesce(p_display_currency, 'INR'),
    v_display_total
  )
  returning id into v_order_id;

  -- Insert snapshot order items
  for v_item in (
    select
      ci.quantity,
      ci.product_id,
      ci.variant_id,
      p.name as product_name,
      p.price as product_price,
      pv.price as variant_price,
      (
        select string_agg(
          case
            when po.name is not null and pov.value is not null then po.name || ': ' || pov.value
            else pov.value
          end,
          ', '
        )
        from variant_option_values vov
        join product_option_values pov on pov.id = vov.option_value_id
        join product_options po on po.id = pov.option_id
        where vov.variant_id = coalesce(ci.variant_id, pv.id)
      ) as computed_variant_label
    from cart_items ci
    join products p on p.id = ci.product_id
    left join product_variants pv on pv.id = ci.variant_id
    where ci.user_id = p_user_id
  ) loop
    if v_item.variant_id is not null then
      v_unit_price := coalesce(effective_price(v_item.variant_id), v_item.variant_price);
    else
      v_unit_price := v_item.product_price;
    end if;

    v_line_total := round(v_unit_price * v_item.quantity, 2);

    insert into order_items (
      order_id,
      product_id,
      variant_id,
      variant_label,
      product_name,
      unit_price,
      quantity,
      line_total
    ) values (
      v_order_id,
      v_item.product_id,
      v_item.variant_id,
      v_item.computed_variant_label,
      v_item.product_name,
      v_unit_price,
      v_item.quantity,
      v_line_total
    );
  end loop;

  return json_build_object(
    'order_id', v_order_id,
    'subtotal', v_subtotal,
    'discount_amount', v_discount_amount,
    'shipping_amount', v_shipping_amount,
    'total', v_total,
    'display_currency', coalesce(p_display_currency, 'INR'),
    'display_total', v_display_total
  );
end;
$$;

revoke execute on function create_pending_checkout_order(uuid, uuid, text, text) from public;
grant execute on function create_pending_checkout_order(uuid, uuid, text, text) to authenticated;
grant execute on function create_pending_checkout_order(uuid, uuid, text, text) to service_role;

-- 2. Fulfill Paid Order RPC (Idempotent Webhook Finalizer)
create or replace function fulfill_paid_order(
  p_order_id uuid,
  p_payment_intent_id text,
  p_customer_id text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
begin
  -- Lock order row for update
  select * into v_order
  from orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'Order % not found', p_order_id;
  end if;

  -- Idempotency check: if already paid, return early with success
  if v_order.payment_status = 'paid' then
    return json_build_object(
      'success', true,
      'order_id', p_order_id,
      'already_paid', true
    );
  end if;

  -- 1. Decrement stock for all items
  for v_item in (
    select variant_id, quantity
    from order_items
    where order_id = p_order_id
  ) loop
    if v_item.variant_id is not null then
      perform decrement_stock(v_item.variant_id, v_item.quantity);
    end if;
  end loop;

  -- 2. Redeem coupon if applicable
  if v_order.coupon_id is not null then
    perform redeem_coupon(v_order.coupon_id);
  end if;

  -- 3. Update order status and stripe tracking fields
  update orders
  set
    status = 'paid',
    payment_status = 'paid',
    stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
    stripe_customer_id = coalesce(p_customer_id, stripe_customer_id)
  where id = p_order_id;

  -- 4. Clear user's cart
  if v_order.user_id is not null then
    delete from cart_items
    where user_id = v_order.user_id;
  end if;

  return json_build_object(
    'success', true,
    'order_id', p_order_id,
    'already_paid', false
  );
end;
$$;

revoke execute on function fulfill_paid_order(uuid, text, text) from public;
grant execute on function fulfill_paid_order(uuid, text, text) to authenticated;
grant execute on function fulfill_paid_order(uuid, text, text) to service_role;
