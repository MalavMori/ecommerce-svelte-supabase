-- ============================================
-- PRODUCT OPTIONS (e.g. "Color", "Size")
-- ============================================
create table product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade not null,
  name text not null,
  position int default 0,
  created_at timestamptz default now(),
  unique(product_id, name)
);

-- ============================================
-- PRODUCT OPTION VALUES (e.g. "Red", "Large")
-- ============================================
create table product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid references product_options(id) on delete cascade not null,
  value text not null,
  position int default 0,
  created_at timestamptz default now(),
  unique(option_id, value)
);

-- ============================================
-- PRODUCT VARIANTS (the actual purchasable unit)
-- ============================================
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade not null,
  sku text unique,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_variants_updated_at
before update on product_variants
for each row
execute function set_updated_at();

-- ============================================
-- VARIANT <-> OPTION VALUE JUNCTION
-- e.g. this variant = {Color: Red} + {Size: Large}
-- ============================================
create table variant_option_values (
  variant_id uuid references product_variants(id) on delete cascade not null,
  option_value_id uuid references product_option_values(id) on delete cascade not null,
  primary key (variant_id, option_value_id)
);

-- ============================================
-- LET IMAGES BELONG TO A SPECIFIC VARIANT (optional)
-- e.g. show the red product photo when red is selected
-- ============================================
alter table product_images
  add column variant_id uuid references product_variants(id) on delete set null;

-- ============================================
-- CART ITEMS NOW POINT AT A VARIANT, NOT JUST A PRODUCT
-- ============================================
alter table cart_items
  add column variant_id uuid references product_variants(id) on delete cascade;

-- Old unique constraint no longer makes sense (was user_id + product_id)
alter table cart_items drop constraint if exists cart_items_user_id_product_id_key;
alter table cart_items add constraint cart_items_user_id_variant_id_key unique(user_id, variant_id);

-- ============================================
-- ORDER ITEMS: snapshot the variant too
-- ============================================
alter table order_items
  add column variant_id uuid references product_variants(id) on delete set null,
  add column variant_label text;  -- snapshot, e.g. "Color: Red, Size: Large"

-- ============================================
-- REPLACE decrement_stock TO TARGET VARIANTS, NOT PRODUCTS
-- ============================================
drop function if exists decrement_stock(uuid, int);

create or replace function decrement_stock(p_variant_id uuid, p_quantity int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rows_affected int;
begin
  update product_variants
  set stock_quantity = stock_quantity - p_quantity
  where id = p_variant_id
    and stock_quantity >= p_quantity;

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$;

revoke execute on function decrement_stock(uuid, int) from public;
grant execute on function decrement_stock(uuid, int) to authenticated;

-- ============================================
-- RLS FOR NEW TABLES
-- ============================================
alter table product_options enable row level security;
alter table product_option_values enable row level security;
alter table product_variants enable row level security;
alter table variant_option_values enable row level security;

create policy "Anyone can view product options"
  on product_options for select using (true);
create policy "Admins manage product options"
  on product_options for insert with check (is_admin());
create policy "Admins update product options"
  on product_options for update using (is_admin());
create policy "Admins delete product options"
  on product_options for delete using (is_admin());

create policy "Anyone can view option values"
  on product_option_values for select using (true);
create policy "Admins manage option values"
  on product_option_values for insert with check (is_admin());
create policy "Admins update option values"
  on product_option_values for update using (is_admin());
create policy "Admins delete option values"
  on product_option_values for delete using (is_admin());

create policy "Anyone can view active variants"
  on product_variants for select using (is_active = true or is_admin());
create policy "Admins manage variants"
  on product_variants for insert with check (is_admin());
create policy "Admins update variants"
  on product_variants for update using (is_admin());
create policy "Admins delete variants"
  on product_variants for delete using (is_admin());

create policy "Anyone can view variant option links"
  on variant_option_values for select using (true);
create policy "Admins manage variant option links"
  on variant_option_values for insert with check (is_admin());
create policy "Admins delete variant option links"
  on variant_option_values for delete using (is_admin());

create index idx_variants_product on product_variants(product_id);
create index idx_options_product on product_options(product_id);
create index idx_option_values_option on product_option_values(option_id);
create index idx_variant_options_variant on variant_option_values(variant_id);

-- ============================================
-- FIX: cart_items.product_id is now denormalized
-- (derivable from variant_id), so it shouldn't block
-- inserts if not explicitly passed
-- ============================================
alter table cart_items alter column product_id drop not null;

-- Missing index for variant lookups
create index idx_cart_items_variant on cart_items(variant_id);