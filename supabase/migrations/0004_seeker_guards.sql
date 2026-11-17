-- A job seeker may ask to be listed in the Talent Marketplace, pause it, or hide it.
-- Only an admin publishes a listing. Consent is stamped with the time it was given.
create or replace function public.guard_seeker_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_trusted() and new.marketplace_status is distinct from old.marketplace_status
     and new.marketplace_status = 'published' then
    raise exception 'Only an admin can publish a marketplace listing';
  end if;
  if new.marketplace_consent and not coalesce(old.marketplace_consent, false) then
    new.marketplace_consent_at := now();
  end if;
  if not new.marketplace_consent then
    new.marketplace_status := 'hidden';
  end if;
  return new;
end $$;
drop trigger if exists seeker_profiles_guard on public.seeker_profiles;
create trigger seeker_profiles_guard before update on public.seeker_profiles for each row execute function public.guard_seeker_profile();

-- Notifications: the owner may only mark them read, never rewrite them.
revoke update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;

-- A job seeker can still read a job they applied to after it closes, so their application history keeps its title.
-- A security definer helper, because the applications policy already reads jobs (a direct subquery would loop).
create or replace function public.applied_to(job uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from applications where job_id = job and seeker_id = auth.uid());
$$;
drop policy if exists "jobs applicant read" on public.jobs;
create policy "jobs applicant read" on public.jobs for select using (public.applied_to(id));
