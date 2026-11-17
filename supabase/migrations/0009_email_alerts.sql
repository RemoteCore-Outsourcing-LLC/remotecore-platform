-- Weekly job alerts: on by default, the seeker can turn them off in Settings or from the link in any alert.
alter table public.seeker_profiles add column if not exists job_alerts boolean not null default true;
alter table public.seeker_profiles add column if not exists last_job_alert_at timestamptz;

-- Stamped the first time a new account confirms its email, so the welcome email and the team alert go out once.
alter table public.profiles add column if not exists welcomed_at timestamptz;

-- Accounts that already exist are not new any more.
update public.profiles set welcomed_at = created_at where welcomed_at is null;
