-- Website settings the team edits from the admin dashboard: company details, announcement, FAQ, services, page headings.
-- Anyone may read them (they are on the public site). Only admins write them.
create table if not exists public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_:/-]{1,80}$'),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
alter table public.site_settings enable row level security;
drop policy if exists "settings read" on public.site_settings;
create policy "settings read" on public.site_settings for select using (true);
drop policy if exists "settings admin" on public.site_settings;
create policy "settings admin" on public.site_settings for all using (is_admin()) with check (is_admin());

-- Inbox: who on the team handled a request, and a private note on it.
alter table public.form_submissions add column if not exists note text check (char_length(note) <= 2000);
alter table public.staffing_requests add column if not exists note text check (char_length(note) <= 2000);
-- Employer messages: when the team read them.
alter table public.messages add column if not exists read_at timestamptz;
-- The team marks employer messages read. Nothing else about a message can change.
drop policy if exists "messages admin update" on public.messages;
create policy "messages admin update" on public.messages for update using (is_admin()) with check (is_admin());
revoke update on public.messages from authenticated, anon;
grant update (read_at) on public.messages to authenticated;
