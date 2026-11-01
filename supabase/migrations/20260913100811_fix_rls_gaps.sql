-- ============================================
-- FIX 1: Prevent role self-escalation via column-level grants
-- ============================================
-- Revoke blanket update, then grant only the columns a user should touch themselves
revoke update on profiles from authenticated;
grant update (full_name, phone, avatar_url) on profiles to authenticated;

-- Admins still need full update ability, handled separately below
create policy "Admins can update any profile including role"
  on profiles for update
  using (is_admin())
  with check (is_admin());

-- ============================================
-- FIX 2: Make RPC functions bypass RLS safely (security definer)
-- These are safe to make security definer because the logic itself
-- is narrow and guarded — it can't be abused into an arbitrary update.
-- ============================================
create or replace function decrement_stock(p_product_id uuid, p_quantity int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rows_affected int;
begin
  update products
  set stock_quantity = stock_quantity - p_quantity
  where id = p_product_id
    and stock_quantity >= p_quantity;

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$;

create or replace function redeem_coupon(p_coupon_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rows_affected int;
begin
  update coupons
  set used_count = used_count + 1
  where id = p_coupon_id
    and is_active = true
    and (max_uses is null or used_count < max_uses)
    and (expires_at is null or expires_at > now());

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$;

-- Lock down who can even call these — authenticated users only, not anon
revoke execute on function decrement_stock(uuid, int) from public;
grant execute on function decrement_stock(uuid, int) to authenticated;

revoke execute on function redeem_coupon(uuid) from public;
grant execute on function redeem_coupon(uuid) to authenticated;

-- ============================================
-- FIX 3: is_admin() hardening — pin search_path
-- (prevents a theoretical search_path hijack on a security definer function)
-- ============================================
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;