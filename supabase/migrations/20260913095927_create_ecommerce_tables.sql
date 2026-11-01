-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

-- ============================================
-- ADDRESSES
-- ============================================
create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  label text,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- CATEGORIES (self-referencing for subcategories)
-- ============================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  parent_id uuid references categories(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================
-- PRODUCTS
-- ============================================
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  sku text unique,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at on every edit
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_updated_at
before update on products
for each row
execute function set_updated_at();

-- ============================================
-- PRODUCT IMAGES
-- ============================================
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade not null,
  url text not null,
  position int default 0,
  created_at timestamptz default now()
);

-- ============================================
-- CART
-- ============================================
create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  quantity int not null check (quantity > 0),
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- ============================================
-- COUPONS
-- ============================================
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null,
  min_order_amount numeric(10,2) default 0,
  max_uses int,
  used_count int default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- ORDERS
-- ============================================
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  address_id uuid references addresses(id) on delete set null,
  coupon_id uuid references coupons(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','paid','shipped','delivered','cancelled')),
  subtotal numeric(10,2) not null,
  discount_amount numeric(10,2) default 0,
  shipping_amount numeric(10,2) default 0,
  total numeric(10,2) not null,
  payment_status text default 'unpaid'
    check (payment_status in ('unpaid','paid','refunded')),
  created_at timestamptz default now()
);

-- Validate order math before insert/update
create or replace function validate_order_total()
returns trigger as $$
begin
  if new.total <> round(new.subtotal - new.discount_amount + new.shipping_amount, 2) then
    raise exception 'Order total (%) does not match subtotal - discount + shipping (%)',
      new.total, round(new.subtotal - new.discount_amount + new.shipping_amount, 2);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_validate_order_total
before insert or update on orders
for each row
execute function validate_order_total();

-- ============================================
-- ORDER ITEMS (snapshot pattern)
-- ============================================
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null
);

-- ============================================
-- REVIEWS
-- ============================================
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(product_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_products_category on products(category_id);
create index idx_order_items_order on order_items(order_id);
create index idx_cart_items_user on cart_items(user_id);
create index idx_reviews_product on reviews(product_id);

-- ============================================
-- RACE-CONDITION-SAFE FUNCTIONS
-- ============================================

-- Atomic stock decrement: fails safely if not enough stock
create or replace function decrement_stock(p_product_id uuid, p_quantity int)
returns boolean as $$
declare
  rows_affected int;
begin
  update products
  set stock_quantity = stock_quantity - p_quantity
  where id = p_product_id
    and stock_quantity >= p_quantity;

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;   -- false means: not enough stock, caller should abort order
end;
$$ language plpgsql;

-- Atomic coupon redemption: fails safely if max_uses reached
create or replace function redeem_coupon(p_coupon_id uuid)
returns boolean as $$
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
  return rows_affected > 0;   -- false means: coupon invalid/expired/exhausted
end;
$$ language plpgsql;