-- Fixes from the security review on 2026-11-18.

-- 1. Email and phone in profiles: nobody reads them through the API, except their own row through my_profile().
--    The team reads them on the server. Employers can no longer pull candidate contact details with a direct call.
--    Email can not be changed through the API at all (only by the server).
revoke select, update on public.profiles from anon, authenticated;
grant select (id, role, status, full_name, country, created_at, updated_at, admin_level, welcomed_at) on public.profiles to authenticated;
grant update (full_name, phone, country, role, status, admin_level, updated_at) on public.profiles to authenticated;

create or replace function public.my_profile() returns setof public.profiles
language sql stable security definer set search_path = public as $$
  select * from profiles where id = auth.uid();
$$;
revoke all on function public.my_profile() from public, anon;
grant execute on function public.my_profile() to authenticated;

-- 2. Only an owner deletes a profile. Staff may edit job seekers and employers, never team accounts.
drop policy if exists "admin delete profile" on public.profiles;
create policy "admin delete profile" on public.profiles for delete using (is_owner());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update
  using (id = auth.uid() or (is_admin() and (role <> 'admin' or is_owner())))
  with check (id = auth.uid() or (is_admin() and (role <> 'admin' or is_owner())));

-- 3. Job seeker details: the owner can read, create (job seekers only) and edit their row, never delete it.
--    A new row can never arrive already published on the marketplace.
drop policy if exists "owner all" on public.seeker_profiles;
drop policy if exists "seeker read" on public.seeker_profiles;
drop policy if exists "seeker insert" on public.seeker_profiles;
drop policy if exists "seeker update" on public.seeker_profiles;
drop policy if exists "seeker delete" on public.seeker_profiles;
create policy "seeker read" on public.seeker_profiles for select using (user_id = auth.uid() or is_admin());
create policy "seeker insert" on public.seeker_profiles for insert with check (
  is_admin() or (user_id = auth.uid() and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'job_seeker')));
create policy "seeker update" on public.seeker_profiles for update using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
create policy "seeker delete" on public.seeker_profiles for delete using (is_admin());

create or replace function public.guard_seeker_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not is_trusted() then
      new.marketplace_status := case when new.marketplace_consent then 'pending' else 'hidden' end;
    end if;
    if new.marketplace_consent then new.marketplace_consent_at := now(); end if;
  else
    if not is_trusted() and new.marketplace_status is distinct from old.marketplace_status
       and new.marketplace_status = 'published' then
      raise exception 'Only an admin can publish a marketplace listing';
    end if;
    if new.marketplace_consent and not coalesce(old.marketplace_consent, false) then
      new.marketplace_consent_at := now();
    end if;
  end if;
  if not new.marketplace_consent then
    new.marketplace_status := 'hidden';
  end if;
  return new;
end $$;
drop trigger if exists seeker_profiles_guard on public.seeker_profiles;
create trigger seeker_profiles_guard before insert or update on public.seeker_profiles for each row execute function public.guard_seeker_profile();

-- Files a job seeker points to must sit in their own folder.
alter table public.seeker_profiles drop constraint if exists seeker_files_own_folder;
alter table public.seeker_profiles add constraint seeker_files_own_folder check (
  (resume_path is null or (resume_path like user_id::text || '/%' and resume_path not like '%..%'))
  and (audio_path is null or (audio_path like user_id::text || '/%' and audio_path not like '%..%')));

-- 4. An employer can not change the company's business email (emails about the account go there).
create or replace function public.guard_company() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_trusted() and (new.status is distinct from old.status or new.owner_id is distinct from old.owner_id
     or new.approved_by is distinct from old.approved_by or new.approved_at is distinct from old.approved_at) then
    raise exception 'Only an admin can approve a company';
  end if;
  if not is_trusted() and new.email is distinct from old.email then
    raise exception 'Please contact RemoteCore to change the business email';
  end if;
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := coalesce(new.approved_at, now());
  end if;
  return new;
end $$;

-- 5. Public form limits: a hashed visitor address so the server can count sends per hour.
alter table public.form_submissions add column if not exists ip_hash text;
create index if not exists form_submissions_ip_idx on public.form_submissions (ip_hash, created_at desc);
create index if not exists form_submissions_email_idx on public.form_submissions (email, created_at desc);
