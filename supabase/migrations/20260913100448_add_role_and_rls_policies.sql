-- ============================================
-- ADD ROLE TO PROFILES
-- ============================================
alter table profiles
  add column role text not null default 'customer'
  check (role in ('customer', 'admin'));

-- Helper function: check if the current logged-in user is an admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
alter table profiles enable row level security;
alter table addresses enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table cart_items enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;

-- ============================================
-- PROFILES POLICIES
-- ============================================
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (is_admin());

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- ADDRESSES POLICIES
-- ============================================
create policy "Users manage their own addresses"
  on addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins view all addresses"
  on addresses for select
  using (is_admin());

-- ============================================
-- CATEGORIES POLICIES (public read, admin write)
-- ============================================
create policy "Anyone can view categories"
  on categories for select
  using (true);

create policy "Admins manage categories"
  on categories for insert
  with check (is_admin());

create policy "Admins update categories"
  on categories for update
  using (is_admin());

create policy "Admins delete categories"
  on categories for delete
  using (is_admin());

-- ============================================
-- PRODUCTS POLICIES (public read active, admin full)
-- ============================================
create policy "Anyone can view active products"
  on products for select
  using (is_active = true or is_admin());

create policy "Admins insert products"
  on products for insert
  with check (is_admin());

create policy "Admins update products"
  on products for update
  using (is_admin());

create policy "Admins delete products"
  on products for delete
  using (is_admin());

-- ============================================
-- PRODUCT IMAGES POLICIES (public read, admin write)
-- ============================================
create policy "Anyone can view product images"
  on product_images for select
  using (true);

create policy "Admins manage product images"
  on product_images for insert
  with check (is_admin());

create policy "Admins update product images"
  on product_images for update
  using (is_admin());

create policy "Admins delete product images"
  on product_images for delete
  using (is_admin());

-- ============================================
-- CART ITEMS POLICIES (owner only)
-- ============================================
create policy "Users manage their own cart"
  on cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- COUPONS POLICIES (public read active, admin write)
-- ============================================
create policy "Anyone can view active coupons"
  on coupons for select
  using (is_active = true or is_admin());

create policy "Admins manage coupons"
  on coupons for insert
  with check (is_admin());

create policy "Admins update coupons"
  on coupons for update
  using (is_admin());

create policy "Admins delete coupons"
  on coupons for delete
  using (is_admin());

-- ============================================
-- ORDERS POLICIES
-- ============================================
create policy "Users view their own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Admins view all orders"
  on orders for select
  using (is_admin());

create policy "Users create their own orders"
  on orders for insert
  with check (auth.uid() = user_id);

create policy "Admins update any order"
  on orders for update
  using (is_admin());

-- ============================================
-- ORDER ITEMS POLICIES (via parent order ownership)
-- ============================================
create policy "Users view items of their own orders"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Admins view all order items"
  on order_items for select
  using (is_admin());

create policy "Users insert items into their own orders"
  on order_items for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- ============================================
-- REVIEWS POLICIES
-- ============================================
create policy "Anyone can view reviews"
  on reviews for select
  using (true);

create policy "Users create their own reviews"
  on reviews for insert
  with check (auth.uid() = user_id);

create policy "Users update their own reviews"
  on reviews for update
  using (auth.uid() = user_id);

create policy "Users delete their own reviews"
  on reviews for delete
  using (auth.uid() = user_id);

create policy "Admins delete any review"
  on reviews for delete
  using (is_admin());