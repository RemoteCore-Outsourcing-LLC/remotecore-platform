-- Profile photo for job seekers (client ask 2026-11-25). Private bucket like the other files:
-- the owner and admins read it, employers get a short signed link from the server after employer_can_see().
alter table public.seeker_profiles add column if not exists photo_path text;  -- path inside the private "photos" bucket

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "own files read" on storage.objects;
drop policy if exists "own files upload" on storage.objects;
drop policy if exists "own files replace" on storage.objects;
drop policy if exists "own files delete" on storage.objects;
create policy "own files read" on storage.objects for select
  using (bucket_id in ('resumes', 'audio', 'documents', 'photos') and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "own files upload" on storage.objects for insert
  with check (bucket_id in ('resumes', 'audio', 'documents', 'photos') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files replace" on storage.objects for update
  using (bucket_id in ('resumes', 'audio', 'documents', 'photos') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete
  using (bucket_id in ('resumes', 'audio', 'documents', 'photos') and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
