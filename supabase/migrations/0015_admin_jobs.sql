-- Admin jobs and applications.
-- The reason RemoteCore gives when it sends an employer's job back for changes. Cleared when it goes live.
alter table public.jobs add column if not exists review_note text check (char_length(review_note) <= 1000);

-- Renaming a category also renames it in every job seeker's preferences (they store the name).
create or replace function public.rename_category(cat_id int, new_name text) returns void
language plpgsql security definer set search_path = public as $$
declare old_name text;
begin
  if not is_admin() then raise exception 'Only an admin can rename categories'; end if;
  select name into old_name from job_categories where id = cat_id;
  if old_name is null then raise exception 'Unknown category'; end if;
  update job_categories set name = new_name where id = cat_id;
  update seeker_profiles set preferred_categories = array_replace(preferred_categories, old_name, new_name)
   where old_name = any(preferred_categories);
end $$;
revoke all on function public.rename_category(int, text) from public, anon;
grant execute on function public.rename_category(int, text) to authenticated;

create index if not exists jobs_company_idx on public.jobs (company_id, updated_at desc);
