-- Admin user management.
-- Two admin levels: owner (everything, including the team and deleting accounts) and staff (day to day work).
alter table public.profiles add column if not exists admin_level text check (admin_level in ('owner', 'staff'));
update public.profiles set admin_level = 'owner' where role = 'admin' and admin_level is null;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and admin_level = 'owner' and status = 'active');
$$;

-- Role, status and admin level change only through an admin (or the server).
-- Only an owner changes role or admin level, or touches another admin's account.
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status or new.admin_level is distinct from old.admin_level) then
    if not is_trusted() then
      raise exception 'Only an admin can change role or status';
    end if;
    if coalesce(auth.role(), '') not in ('service_role', '') and not is_owner()
       and (new.role is distinct from old.role or new.admin_level is distinct from old.admin_level or old.role = 'admin') then
      raise exception 'Only an owner can change team accounts';
    end if;
  end if;
  if new.role = 'admin' and new.admin_level is null then new.admin_level := 'staff'; end if;
  if new.role <> 'admin' then new.admin_level := null; end if;
  new.updated_at := now();
  return new;
end $$;

create index if not exists profiles_role_idx on public.profiles (role, created_at desc);
create index if not exists admin_log_target_idx on public.admin_log (target, created_at desc);
