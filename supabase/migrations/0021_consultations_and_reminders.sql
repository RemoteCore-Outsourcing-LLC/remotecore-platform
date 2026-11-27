-- Website changes 2026-11-26 (Kemar's "RemoteCore Website Changes" doc).

-- 1. Consultation calls booked straight from /book-consultation, using the same open hours as interviews.
create table if not exists public.consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.form_submissions (id) on delete set null,
  status text not null default 'booked' check (status in ('booked', 'cancelled', 'done', 'no_show')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  company text,
  contact_name text,
  email text,
  talent_type text,
  meeting_link text,
  created_at timestamptz not null default now()
);
create unique index if not exists consultation_one_per_slot on public.consultation_bookings (starts_at) where status = 'booked';
create index if not exists consultation_starts on public.consultation_bookings (starts_at);
alter table public.consultation_bookings enable row level security;
drop policy if exists "admin all" on public.consultation_bookings;
create policy "admin all" on public.consultation_bookings for all using (is_admin()) with check (is_admin());
-- Writes happen on the server (service role) after the checks.

-- 2. Reminder emails for job seekers who signed up but did not finish their application.
alter table public.seeker_profiles
  add column if not exists signup_reminders int not null default 0,
  add column if not exists last_signup_reminder_at timestamptz,
  add column if not exists signup_reminders_off boolean not null default false;
