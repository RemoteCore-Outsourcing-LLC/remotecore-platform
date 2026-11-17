-- RemoteCore platform, first migration.
-- Three roles: job_seeker, employer, admin. Row level security is on for every table.
-- Resumes, audio and documents live in PRIVATE storage buckets, opened only with signed links.

-- ---------- types ----------
create type public.user_role as enum ('job_seeker', 'employer', 'admin');
create type public.account_status as enum ('active', 'suspended', 'deactivated');
create type public.company_status as enum ('pending', 'approved', 'suspended');
create type public.job_status as enum ('draft', 'pending', 'published', 'paused', 'closed');
create type public.application_status as enum (
  'application_received', 'under_review', 'shortlisted', 'interview_stage', 'selected', 'not_selected', 'position_filled'
);
create type public.listing_status as enum ('hidden', 'pending', 'published', 'paused');
create type public.request_status as enum ('new', 'in_review', 'closed');

-- ---------- people ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'job_seeker',
  status public.account_status not null default 'active',
  full_name text not null default '',
  email text not null default '',
  phone text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seeker_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  headline text,
  summary text,
  expected_salary numeric(12, 2),
  salary_currency text default 'USD',
  years_experience int,
  employment_types text[] not null default '{}',   -- full_time, part_time, contract, freelance
  preferred_categories text[] not null default '{}',
  preferred_hours text,
  time_zone text,
  available_from date,
  linkedin text,
  resume_path text,          -- path inside the private "resumes" bucket
  resume_text text,          -- plain text of the resume, ready for search and the later AI phase
  audio_path text,           -- path inside the private "audio" bucket
  marketplace_consent boolean not null default false,
  marketplace_consent_at timestamptz,
  marketplace_status public.listing_status not null default 'hidden',
  updated_at timestamptz not null default now()
);

create table public.computer_specs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  computer_type text,        -- desktop, laptop
  operating_system text,
  processor text,
  ram text,
  storage text,
  connection_type text,
  download_mbps numeric(8, 1),
  upload_mbps numeric(8, 1),
  has_webcam boolean,
  has_microphone boolean,
  other_equipment text,
  updated_at timestamptz not null default now()
);

create table public.work_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company text not null, title text not null, start_date date, end_date date, description text,
  created_at timestamptz not null default now()
);
create table public.education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  school text not null, degree text, field text, start_year int, end_year int,
  created_at timestamptz not null default now()
);
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null, issuer text, year int,
  created_at timestamptz not null default now()
);
create table public.seeker_skills (
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill text not null,
  primary key (user_id, skill)
);
create table public.seeker_languages (
  user_id uuid not null references public.profiles (id) on delete cascade,
  language text not null,
  level text not null default 'fluent',  -- basic, conversational, fluent, native
  primary key (user_id, language)
);

-- ---------- companies and jobs ----------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null,
  contact_person text not null,
  email text not null,
  phone text,
  country text,
  website text,
  industry text,
  description text,
  status public.company_status not null default 'pending',
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.job_categories (
  id serial primary key,
  name text not null unique,
  sort int not null default 0
);
insert into public.job_categories (name, sort) values
  ('Healthcare Administrative Support', 1), ('Customer Experience & Support', 2),
  ('Virtual & Executive Assistance', 3), ('Sales & Business Support', 4),
  ('Technology & IT', 5), ('Finance & Accounting', 6), ('Project Managers & Estimators', 7), ('Other', 99);

-- array_to_string is not marked immutable, so a small wrapper is needed for the search column.
create or replace function public.tags_text(text[]) returns text language sql immutable as $$ select array_to_string($1, ' ') $$;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete set null,  -- null = posted by RemoteCore
  created_by uuid not null references public.profiles (id),
  category_id int references public.job_categories (id),
  title text not null,
  description text not null,
  skills text[] not null default '{}',
  qualifications text,
  experience_level text,      -- entry, mid, senior
  salary_min numeric(12, 2),
  salary_max numeric(12, 2),
  salary_currency text default 'USD',
  salary_period text default 'month',
  employment_type text,       -- full_time, part_time, contract, freelance
  remote_type text not null default 'fully_remote',  -- fully_remote, location_restricted
  location_restrictions text,
  computer_requirements text,
  hours_time_zone text,
  deadline date,
  status public.job_status not null default 'pending',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', public.tags_text(skills)), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored
);
create index jobs_search_idx on public.jobs using gin (search);
create index jobs_status_idx on public.jobs (status, published_at desc);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  status public.application_status not null default 'application_received',
  note text,
  resume_path text,            -- the resume as it was when they applied
  extra_documents text[] not null default '{}',  -- paths in the private "documents" bucket
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, seeker_id)
);
create index applications_seeker_idx on public.applications (seeker_id);

create table public.application_status_history (
  id bigserial primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  changed_by uuid references public.profiles (id),
  changed_at timestamptz not null default now()
);

create table public.saved_jobs (
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

-- An admin can share a candidate with an employer without a job application.
create table public.candidate_shares (
  company_id uuid not null references public.companies (id) on delete cascade,
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  shared_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (company_id, seeker_id)
);

create table public.staffing_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete set null,
  created_by uuid references public.profiles (id),
  company_name text, contact_name text, email text, phone text, industry text,
  position text not null, number_needed int, skills text, experience_level text,
  compensation text, region text, start_date date, details text,
  fee_acknowledged boolean not null default false,
  status public.request_status not null default 'new',
  created_at timestamptz not null default now()
);

-- Every public form (consultation, contact, introduction, career session, notify me).
create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  email text,
  data jsonb not null,
  status public.request_status not null default 'new',
  created_at timestamptz not null default now()
);
create index form_submissions_kind_idx on public.form_submissions (kind, created_at desc);

-- Employer <-> RemoteCore messages.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null, body text, link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_log (
  id bigserial primary key,
  actor_id uuid references public.profiles (id),
  action text not null,
  target text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ---------- helper functions (security definer, so policies do not loop) ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create or replace function public.my_company_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from companies where owner_id = auth.uid() and status = 'approved';
$$;

-- Can the signed in employer see this job seeker? Only if they applied to the employer's job, or an admin shared them.
create or replace function public.employer_can_see(seeker uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from applications a join jobs j on j.id = a.job_id
    where a.seeker_id = seeker and j.company_id = my_company_id()
  ) or exists (
    select 1 from candidate_shares s where s.seeker_id = seeker and s.company_id = my_company_id()
  );
$$;

-- Trusted = an admin, the server (service role), or a direct database session (no web login at all).
create or replace function public.is_trusted() returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin() or coalesce(auth.role(), '') in ('service_role', '');
$$;

-- ---------- triggers ----------
-- New sign up: make the profile. Nobody can sign up as admin.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.user_role;
begin
  r := case when new.raw_user_meta_data ->> 'role' = 'employer' then 'employer' else 'job_seeker' end;
  insert into profiles (id, role, full_name, email)
  values (new.id, r, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.email, ''));
  if r = 'job_seeker' then insert into seeker_profiles (user_id) values (new.id); end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Only admins change role and account status.
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status) and not is_trusted() then
    raise exception 'Only an admin can change role or status';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile();

-- Only admins approve companies.
create or replace function public.guard_company() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not is_trusted() then
    raise exception 'Only an admin can approve a company';
  end if;
  return new;
end $$;
create trigger companies_guard before update on public.companies for each row execute function public.guard_company();

-- Employers can never publish their own job: it waits for an admin.
create or replace function public.guard_job() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_trusted() then
    if tg_op = 'INSERT' then
      new.status := case when new.status = 'draft' then 'draft' else 'pending' end;
    elsif new.status = 'published' and old.status <> 'published' then
      raise exception 'A job goes live only after RemoteCore approves it';
    end if;
  end if;
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  new.updated_at := now();
  return new;
end $$;
create trigger jobs_guard before insert or update on public.jobs for each row execute function public.guard_job();

-- Every status change is written to the history.
create or replace function public.log_application_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into application_status_history (application_id, from_status, to_status, changed_by) values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into application_status_history (application_id, from_status, to_status, changed_by) values (new.id, old.status, new.status, auth.uid());
    new.updated_at := now();
  end if;
  return new;
end $$;
create trigger applications_status_ins after insert on public.applications for each row execute function public.log_application_status();
create trigger applications_status_upd before update on public.applications for each row execute function public.log_application_status();

-- Job seekers can withdraw nothing but their own note; only employers and admins move the status.
create or replace function public.guard_application() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not is_trusted()
     and not exists (select 1 from jobs j where j.id = new.job_id and j.company_id = my_company_id()) then
    raise exception 'You cannot change this status';
  end if;
  return new;
end $$;
create trigger applications_guard before update on public.applications for each row execute function public.guard_application();

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.seeker_profiles enable row level security;
alter table public.computer_specs enable row level security;
alter table public.work_history enable row level security;
alter table public.education enable row level security;
alter table public.certifications enable row level security;
alter table public.seeker_skills enable row level security;
alter table public.seeker_languages enable row level security;
alter table public.companies enable row level security;
alter table public.job_categories enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.candidate_shares enable row level security;
alter table public.staffing_requests enable row level security;
alter table public.form_submissions enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_log enable row level security;

-- profiles
create policy "own profile read" on public.profiles for select using (id = auth.uid() or is_admin() or employer_can_see(id));
create policy "own profile update" on public.profiles for update using (id = auth.uid() or is_admin());
create policy "admin delete profile" on public.profiles for delete using (is_admin());

-- job seeker details: owner and admin do everything; employers read only candidates they may see
do $$
declare t text;
begin
  foreach t in array array['seeker_profiles','computer_specs','work_history','education','certifications','seeker_skills','seeker_languages'] loop
    execute format('create policy "owner all" on public.%I for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin())', t);
    execute format('create policy "employer read" on public.%I for select using (employer_can_see(user_id))', t);
  end loop;
end $$;

-- companies
create policy "company read" on public.companies for select using (owner_id = auth.uid() or is_admin());
create policy "company create" on public.companies for insert with check (owner_id = auth.uid() and status = 'pending');
create policy "company update" on public.companies for update using (owner_id = auth.uid() or is_admin());
create policy "company delete" on public.companies for delete using (is_admin());

-- categories: everyone reads, admin edits
create policy "categories read" on public.job_categories for select using (true);
create policy "categories admin" on public.job_categories for all using (is_admin()) with check (is_admin());

-- jobs: published jobs are public; companies manage their own; admin everything
create policy "jobs public read" on public.jobs for select using (status = 'published' or is_admin() or (company_id is not null and company_id = my_company_id()));
create policy "jobs company insert" on public.jobs for insert with check ((company_id = my_company_id() and created_by = auth.uid()) or is_admin());
create policy "jobs company update" on public.jobs for update using ((company_id is not null and company_id = my_company_id()) or is_admin());
create policy "jobs delete" on public.jobs for delete using (is_admin());

-- applications
create policy "apps read" on public.applications for select using (
  seeker_id = auth.uid() or is_admin()
  or exists (select 1 from jobs j where j.id = job_id and j.company_id is not null and j.company_id = my_company_id())
);
create policy "apps apply" on public.applications for insert with check (
  seeker_id = auth.uid() and status = 'application_received'
  and exists (select 1 from jobs j where j.id = job_id and j.status = 'published')
  and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'job_seeker' and p.status = 'active')
);
create policy "apps update" on public.applications for update using (
  seeker_id = auth.uid() or is_admin()
  or exists (select 1 from jobs j where j.id = job_id and j.company_id is not null and j.company_id = my_company_id())
);
create policy "apps delete" on public.applications for delete using (is_admin());

create policy "history read" on public.application_status_history for select using (
  exists (select 1 from applications a where a.id = application_id)  -- inherits the applications policy
);

-- saved jobs
create policy "saved own" on public.saved_jobs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- candidate shares
create policy "shares read" on public.candidate_shares for select using (is_admin() or company_id = my_company_id());
create policy "shares admin" on public.candidate_shares for all using (is_admin()) with check (is_admin());

-- staffing requests
create policy "requests read" on public.staffing_requests for select using (is_admin() or (company_id is not null and company_id = my_company_id()));
create policy "requests create" on public.staffing_requests for insert with check (created_by = auth.uid() and (company_id is null or company_id = my_company_id()));
create policy "requests admin" on public.staffing_requests for update using (is_admin());

-- public forms are written by the server only; admins read them
create policy "forms admin" on public.form_submissions for all using (is_admin()) with check (is_admin());

-- messages
create policy "messages read" on public.messages for select using (is_admin() or company_id = my_company_id());
create policy "messages send" on public.messages for insert with check (sender_id = auth.uid() and (is_admin() or company_id = my_company_id()));

-- notifications
create policy "notes own" on public.notifications for select using (user_id = auth.uid());
create policy "notes mark read" on public.notifications for update using (user_id = auth.uid());

-- admin log
create policy "log admin" on public.admin_log for select using (is_admin());

-- ---------- private storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('resumes', 'resumes', false, 10485760, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('audio', 'audio', false, 20971520, array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/aac']),
  ('documents', 'documents', false, 10485760, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']);

-- Files go in a folder named after the user's id: <user id>/<file>. Owners manage their own files.
-- Admins read everything. Employers never read storage directly: the server checks employer_can_see()
-- and then hands out a signed link that expires.
create policy "own files read" on storage.objects for select
  using (bucket_id in ('resumes', 'audio', 'documents') and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "own files upload" on storage.objects for insert
  with check (bucket_id in ('resumes', 'audio', 'documents') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files replace" on storage.objects for update
  using (bucket_id in ('resumes', 'audio', 'documents') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete
  using (bucket_id in ('resumes', 'audio', 'documents') and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
