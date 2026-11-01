-- ============================================
-- PUBLIC FILE STORAGE BUCKET
-- Public read for everyone, write/edit/delete restricted to admins only
-- ============================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'files',
  'files',
  true,     -- public: anyone can view/download
  20971520, -- 20MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'application/zip'
  ]
)
on conflict (id) do update
set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public = excluded.public;

-- Anyone can view/download files in this bucket
create policy "Public files are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'files');

-- Only admins can upload
create policy "Only admins upload public files"
  on storage.objects for insert
  with check (
    bucket_id = 'files'
    and is_admin()
  );

-- Only admins can update
create policy "Only admins update public files"
  on storage.objects for update
  using (
    bucket_id = 'files'
    and is_admin()
  );

-- Only admins can delete
create policy "Only admins delete public files"
  on storage.objects for delete
  using (
    bucket_id = 'files'
    and is_admin()
  );