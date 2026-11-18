-- Admin candidate management: tags (categories) and private notes on a candidate. Only the team sees them.
create table if not exists public.candidate_tags (
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  tag text not null check (char_length(tag) between 1 and 40),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (seeker_id, tag)
);
create index if not exists candidate_tags_tag_idx on public.candidate_tags (tag);

create table if not exists public.candidate_notes (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists candidate_notes_seeker_idx on public.candidate_notes (seeker_id, created_at desc);

alter table public.candidate_tags enable row level security;
alter table public.candidate_notes enable row level security;
drop policy if exists "tags admin" on public.candidate_tags;
create policy "tags admin" on public.candidate_tags for all using (is_admin()) with check (is_admin());
drop policy if exists "notes admin read" on public.candidate_notes;
create policy "notes admin read" on public.candidate_notes for select using (is_admin());
drop policy if exists "notes admin write" on public.candidate_notes;
create policy "notes admin write" on public.candidate_notes for insert with check (is_admin() and author_id = auth.uid());
drop policy if exists "notes admin delete" on public.candidate_notes;
create policy "notes admin delete" on public.candidate_notes for delete using (is_admin());

-- When an admin publishes or pauses a listing, stamp it so the team can see when it changed.
alter table public.seeker_profiles add column if not exists marketplace_changed_at timestamptz;
