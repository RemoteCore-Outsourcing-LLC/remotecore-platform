-- 0019: changes from the call on 2026-11-23.
-- 1. Profile: one Submit button, an autosaved draft, and the date the application was submitted.
-- 2. Candidate stage set by the team (shortlist without a job application).
-- 3. Interview booking: the team sets open times, a shortlisted candidate picks one.
-- 4. Contracts: the team writes a template, an employer signs it before paying.

-- 1 and 2. Profile draft, submit date and team stage.
alter table public.seeker_profiles add column if not exists draft jsonb;
alter table public.seeker_profiles add column if not exists draft_at timestamptz;
alter table public.seeker_profiles add column if not exists submitted_at timestamptz;
alter table public.seeker_profiles add column if not exists stage text not null default 'new';
alter table public.seeker_profiles add column if not exists stage_changed_at timestamptz;
alter table public.seeker_profiles drop constraint if exists seeker_stage_check;
alter table public.seeker_profiles add constraint seeker_stage_check
  check (stage in ('new', 'shortlisted', 'interview', 'approved', 'not_a_fit'));

-- Only the team (or the server) changes the stage and the submit date.
create or replace function public.guard_seeker_team_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_trusted() then
    if tg_op = 'INSERT' then
      new.stage := 'new'; new.submitted_at := null;
    elsif new.stage is distinct from old.stage or new.submitted_at is distinct from old.submitted_at then
      raise exception 'Only the RemoteCore team can change this';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.stage is distinct from old.stage then new.stage_changed_at := now(); end if;
  return new;
end $$;
drop trigger if exists seeker_team_fields_guard on public.seeker_profiles;
create trigger seeker_team_fields_guard before insert or update on public.seeker_profiles
  for each row execute function public.guard_seeker_team_fields();

-- 3. Interview booking.
create table if not exists public.interview_settings (
  id int primary key default 1 check (id = 1),
  active boolean not null default false,
  meeting_link text,
  time_zone text not null default 'America/Chicago',
  days int[] not null default '{1,2,3,4,5}',   -- 0 Sunday ... 6 Saturday
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  slot_minutes int not null default 30 check (slot_minutes between 10 and 180),
  notice_hours int not null default 12 check (notice_hours between 0 and 336),
  days_ahead int not null default 14 check (days_ahead between 1 and 60),
  blocked_dates date[] not null default '{}',
  auto_invite boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.interview_settings (id) values (1) on conflict do nothing;
alter table public.interview_settings enable row level security;
drop policy if exists "admin all" on public.interview_settings;
create policy "admin all" on public.interview_settings for all using (is_admin()) with check (is_admin());

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  application_id uuid references public.applications (id) on delete set null,
  status text not null default 'invited' check (status in ('invited', 'booked', 'cancelled', 'done', 'no_show')),
  starts_at timestamptz,
  ends_at timestamptz,
  meeting_link text,
  invited_at timestamptz not null default now(),
  invited_by uuid references public.profiles (id) on delete set null,
  booked_at timestamptz,
  reminded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists interviews_seeker on public.interviews (seeker_id, created_at desc);
create unique index if not exists interviews_one_per_slot on public.interviews (starts_at) where status = 'booked';
create unique index if not exists interviews_one_open on public.interviews (seeker_id) where status in ('invited', 'booked');
alter table public.interviews enable row level security;
drop policy if exists "seeker read own" on public.interviews;
create policy "seeker read own" on public.interviews for select using (seeker_id = auth.uid() or is_admin());
-- Writes happen on the server after the checks (booking, invites, reminders).

-- 4. Contracts.
create table if not exists public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  active boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists contract_one_active on public.contract_templates (active) where active;
alter table public.contract_templates enable row level security;
drop policy if exists "read active or admin" on public.contract_templates;
create policy "read active or admin" on public.contract_templates for select using (active or is_admin());
drop policy if exists "admin write" on public.contract_templates;
create policy "admin write" on public.contract_templates for all using (is_admin()) with check (is_admin());

create table if not exists public.contract_signatures (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.contract_templates (id) on delete set null,
  company_id uuid references public.companies (id) on delete set null,
  signer_id uuid references public.profiles (id) on delete set null,
  title text not null,
  body text not null,            -- the exact text they signed, names filled in
  signer_name text not null,
  signer_email text not null,
  company_name text not null,
  ip_hash text,
  signed_at timestamptz not null default now()
);
create index if not exists contract_sigs_company on public.contract_signatures (company_id, signed_at desc);
alter table public.contract_signatures enable row level security;
drop policy if exists "own company or admin" on public.contract_signatures;
create policy "own company or admin" on public.contract_signatures for select using (
  is_admin() or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()));
-- Signing is written on the server after the checks. A signed contract is never changed.
