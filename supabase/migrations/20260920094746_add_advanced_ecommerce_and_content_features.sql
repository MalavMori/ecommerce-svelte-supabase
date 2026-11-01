-- ============================================
-- WISHLISTS
-- ============================================
create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

create index idx_wishlists_user on wishlists(user_id);

alter table wishlists enable row level security;

create policy "Users manage their own wishlist"
  on wishlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- STRIPE PAYMENT FIELDS ON ORDERS
-- ============================================
alter table orders
  add column stripe_payment_intent_id text unique,
  add column stripe_customer_id text;

-- ============================================
-- ORDER STATUS HISTORY (auto-logged, not manually inserted)
-- ============================================
create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  status text not null,
  changed_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_order_status_history_order on order_status_history(order_id);

alter table order_status_history enable row level security;

create policy "Users view history of their own orders"
  on order_status_history for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_status_history.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Admins view all order history"
  on order_status_history for select
  using (is_admin());

-- FIXED: explicit branching instead of a combined condition that
-- referenced OLD during INSERT (which is unassigned and unsafe)
create or replace function log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_log_order_status
after insert or update on orders
for each row
execute function log_order_status_change();

-- ============================================
-- SHIPMENT TRACKING
-- ============================================
create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  carrier text,
  tracking_number text,
  status text not null default 'pending'
    check (status in ('pending','shipped','in_transit','delivered','failed')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  estimated_delivery date,
  created_at timestamptz default now()
);

create index idx_shipments_order on shipments(order_id);

alter table shipments enable row level security;

create policy "Users view shipments of their own orders"
  on shipments for select
  using (
    exists (
      select 1 from orders
      where orders.id = shipments.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Admins manage shipments"
  on shipments for all
  using (is_admin())
  with check (is_admin());

-- ============================================
-- RETURNS / REFUNDS (whole order only)
-- ============================================
create table returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete set null,
  reason text not null,
  status text not null default 'requested'
    check (status in ('requested','approved','rejected','refunded')),
  refund_amount numeric(10,2),
  stripe_refund_id text,
  requested_at timestamptz default now(),
  resolved_at timestamptz
);

create index idx_returns_order on returns(order_id);
create index idx_returns_user on returns(user_id);

create unique index idx_one_active_return_per_order
  on returns(order_id)
  where status in ('requested', 'approved');

alter table returns enable row level security;

create policy "Users view their own returns"
  on returns for select
  using (auth.uid() = user_id);

create policy "Admins view all returns"
  on returns for select
  using (is_admin());

create policy "Users request a return on their own order"
  on returns for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from orders
      where orders.id = returns.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Admins update returns"
  on returns for update
  using (is_admin());

-- ============================================
-- REVIEW IMAGES
-- ============================================
create table review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade not null,
  url text not null,
  position int default 0,
  created_at timestamptz default now()
);

create index idx_review_images_review on review_images(review_id);

alter table review_images enable row level security;

create policy "Anyone can view review images"
  on review_images for select
  using (true);

create policy "Users add images to their own reviews"
  on review_images for insert
  with check (
    exists (
      select 1 from reviews
      where reviews.id = review_images.review_id
        and reviews.user_id = auth.uid()
    )
  );

create policy "Users delete images from their own reviews"
  on review_images for delete
  using (
    exists (
      select 1 from reviews
      where reviews.id = review_images.review_id
        and reviews.user_id = auth.uid()
    )
  );

create policy "Admins delete any review image"
  on review_images for delete
  using (is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-images',
  'review-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Review images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'review-images');

create policy "Users upload their own review images"
  on storage.objects for insert
  with check (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete their own review images"
  on storage.objects for delete
  using (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- VERIFIED PURCHASE BADGE (auto-computed on insert)
-- ============================================
alter table reviews
  add column is_verified_purchase boolean not null default false;

create or replace function set_verified_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_verified_purchase := exists (
    select 1
    from order_items oi
    join orders o on o.id = oi.order_id
    where oi.product_id = new.product_id
      and o.user_id = new.user_id
      and o.status = 'delivered'
  );
  return new;
end;
$$;

create trigger trg_set_verified_purchase
before insert on reviews
for each row
execute function set_verified_purchase();

-- ============================================
-- FLASH SALES (on variants)
-- ============================================
alter table product_variants
  add column sale_price numeric(10,2) check (sale_price is null or sale_price >= 0),
  add column sale_starts_at timestamptz,
  add column sale_ends_at timestamptz;

alter table product_variants
  add constraint chk_sale_price_lower_than_price
  check (sale_price is null or sale_price < price);

alter table product_variants
  add constraint chk_sale_dates_valid
  check (sale_starts_at is null or sale_ends_at is null or sale_ends_at > sale_starts_at);

create or replace function effective_price(p_variant_id uuid)
returns numeric
language sql
stable
as $$
  select case
    when sale_price is not null
      and (sale_starts_at is null or now() >= sale_starts_at)
      and (sale_ends_at is null or now() <= sale_ends_at)
    then sale_price
    else price
  end
  from product_variants
  where id = p_variant_id;
$$;

-- ============================================
-- SEO FIELDS
-- ============================================
alter table products
  add column meta_title text,
  add column meta_description text,
  add column og_image_url text;

-- ============================================
-- BANNERS (homepage hero/promo carousel)
-- ============================================
create table banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  link_url text,
  position int not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_banners_updated_at
before update on banners
for each row
execute function set_updated_at();

create index idx_banners_active_position on banners(is_active, position);

alter table banners enable row level security;

create policy "Anyone can view active banners"
  on banners for select
  using (
    (is_active = true
     and (starts_at is null or now() >= starts_at)
     and (ends_at is null or now() <= ends_at))
    or is_admin()
  );

create policy "Admins manage banners"
  on banners for insert with check (is_admin());
create policy "Admins update banners"
  on banners for update using (is_admin());
create policy "Admins delete banners"
  on banners for delete using (is_admin());

-- ============================================
-- FEATURED COLLECTIONS (curated category picks for homepage)
-- ============================================
create table featured_collections (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade not null,
  label text,
  image_url text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  unique(category_id)
);

create index idx_featured_collections_position on featured_collections(is_active, position);

alter table featured_collections enable row level security;

create policy "Anyone can view active featured collections"
  on featured_collections for select
  using (is_active = true or is_admin());

create policy "Admins manage featured collections"
  on featured_collections for insert with check (is_admin());
create policy "Admins update featured collections"
  on featured_collections for update using (is_admin());
create policy "Admins delete featured collections"
  on featured_collections for delete using (is_admin());

-- ============================================
-- FEATURED PRODUCTS (curated product rows, e.g. "New Arrivals")
-- ============================================
create table featured_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade not null,
  section text not null default 'featured'
    check (section in ('featured', 'new_arrivals', 'best_sellers', 'trending')),
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  unique(product_id, section)
);

create index idx_featured_products_section on featured_products(section, is_active, position);

alter table featured_products enable row level security;

create policy "Anyone can view active featured products"
  on featured_products for select
  using (is_active = true or is_admin());

create policy "Admins manage featured products"
  on featured_products for insert with check (is_admin());
create policy "Admins update featured products"
  on featured_products for update using (is_admin());
create policy "Admins delete featured products"
  on featured_products for delete using (is_admin());

-- ============================================
-- STATIC PAGES (About, FAQ, Terms, Contact, etc.)
-- ============================================
create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content text not null,
  meta_title text,
  meta_description text,
  is_published boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_pages_updated_at
before update on pages
for each row
execute function set_updated_at();

alter table pages enable row level security;

create policy "Anyone can view published pages"
  on pages for select
  using (is_published = true or is_admin());

create policy "Admins manage pages"
  on pages for insert with check (is_admin());
create policy "Admins update pages"
  on pages for update using (is_admin());
create policy "Admins delete pages"
  on pages for delete using (is_admin());

insert into pages (slug, title, content, is_published) values
  ('about', 'About Us', 'Content coming soon.', false),
  ('faq', 'Frequently Asked Questions', 'Content coming soon.', false),
  ('terms', 'Terms & Conditions', 'Content coming soon.', false),
  ('contact', 'Contact Us', 'Content coming soon.', false);