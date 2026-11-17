-- Job search. Keywords match title, skills, description, qualifications (full text, word starts count)
-- and the industry name. Filters: category, employment type, level, remote type, country, minimum monthly pay.
-- Runs as the caller, so row level security still decides what is visible; it also only returns open jobs.

alter table public.jobs drop column search;
alter table public.jobs add column search tsvector generated always as (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', public.tags_text(skills)), 'B') ||
  setweight(to_tsvector('english', coalesce(qualifications, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'D')
) stored;
create index if not exists jobs_search_idx on public.jobs using gin (search);
create index if not exists jobs_open_idx on public.jobs (status, published_at desc);

-- Monthly pay in the job's own currency, so hourly, weekly and yearly pay compare fairly.
create or replace function public.monthly_pay(amount numeric, period text) returns numeric
language sql immutable as $$
  select case coalesce(period, 'month')
    when 'hour' then amount * 160 when 'week' then amount * 52 / 12 when 'year' then amount / 12 else amount end;
$$;

create or replace function public.search_jobs(
  q text default null, category int default null, types text[] default null, levels text[] default null,
  remote text default null, country text default null, pay_min numeric default null,
  lim int default 20, off int default 0
) returns table (id uuid, total bigint)
language sql stable security invoker set search_path = public as $$
  with terms as (
    select nullif(array_to_string(array(
      select w || ':*' from regexp_split_to_table(lower(coalesce(q, '')), '[^a-z0-9]+') w where length(w) > 1 limit 8
    ), ' & '), '') as tsq
  ), hits as (
    select j.id, j.published_at,
      case when t.tsq is null then 0 else ts_rank(j.search, to_tsquery('english', t.tsq)) end
        + case when q is not null and length(trim(q)) > 1 and c.name ilike '%' || trim(q) || '%' then 0.5 else 0 end as rank
    from jobs j
    cross join terms t
    left join job_categories c on c.id = j.category_id
    where j.status = 'published'
      and (j.deadline is null or j.deadline >= current_date)
      and (t.tsq is null or j.search @@ to_tsquery('english', t.tsq) or c.name ilike '%' || trim(q) || '%')
      and (category is null or j.category_id = category)
      and (types is null or cardinality(types) = 0 or j.employment_type = any(types))
      and (levels is null or cardinality(levels) = 0 or j.experience_level = any(levels))
      and (remote is null or j.remote_type = remote)
      and (country is null or j.remote_type = 'fully_remote' or j.location_restrictions ilike '%' || country || '%')
      and (pay_min is null or (coalesce(j.salary_currency, 'USD') = 'USD'
           and public.monthly_pay(coalesce(j.salary_max, j.salary_min), j.salary_period) >= pay_min))
  )
  select id, count(*) over () as total from hits
  order by rank desc, published_at desc nulls last
  limit least(greatest(lim, 1), 50) offset greatest(off, 0);
$$;
grant execute on function public.search_jobs(text, int, text[], text[], text, text, numeric, int, int) to anon, authenticated;
