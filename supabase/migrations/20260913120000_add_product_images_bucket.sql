-- ============================================
-- PRODUCT IMAGES STORAGE BUCKET
-- ============================================

-- Create a public bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Only admins can upload product images
create policy "Admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

-- Only admins can delete product images
create policy "Admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- Allow public read access to product images
create policy "Public can read product images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');
