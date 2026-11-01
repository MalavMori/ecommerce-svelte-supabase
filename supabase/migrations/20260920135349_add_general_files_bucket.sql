-- ============================================
-- GENERAL FILE STORAGE BUCKET (any file type, owner-private)
-- Convention: files are stored as {user_id}/{filename}
-- ============================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'files',
  'files',
  false,   -- private: access only via signed URLs or RLS-checked requests
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

-- Users can view only their own files (folder-owner check, same as avatars)
create policy "Users view their own files"
  on storage.objects for select
  using (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can view every file in this bucket
create policy "Admins view all files"
  on storage.objects for select
  using (
    bucket_id = 'files'
    and is_admin()
  );

create policy "Users upload their own files"
  on storage.objects for insert
  with check (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update their own files"
  on storage.objects for update
  using (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete their own files"
  on storage.objects for delete
  using (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins delete any file"
  on storage.objects for delete
  using (
    bucket_id = 'files'
    and is_admin()
  );