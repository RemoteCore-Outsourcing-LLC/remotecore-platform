-- Employer sign up: the company details travel with the sign up and the company row is made in the same step.
-- It always starts as 'pending'. Only an admin (or the server) can approve it (guard_company).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r public.user_role;
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  pay numeric;
begin
  r := case when m ->> 'role' = 'employer' then 'employer' else 'job_seeker' end;
  insert into profiles (id, role, full_name, email, phone, country)
  values (new.id, r, left(coalesce(m ->> 'full_name', ''), 200), coalesce(new.email, ''),
          left(m ->> 'phone', 40), left(m ->> 'country', 100));
  if r = 'job_seeker' then
    begin pay := nullif(m ->> 'expected_salary', '')::numeric; exception when others then pay := null; end;
    insert into seeker_profiles (user_id, expected_salary, salary_currency)
    values (new.id, case when pay between 0 and 10000000 then pay end, coalesce(left(m ->> 'salary_currency', 3), 'USD'));
  else
    insert into companies (owner_id, name, contact_person, email, phone, country, website, industry, description, status)
    values (new.id,
            left(coalesce(nullif(m ->> 'company', ''), 'New company'), 200),
            left(coalesce(m ->> 'full_name', ''), 200),
            coalesce(new.email, ''),
            left(m ->> 'phone', 40), left(m ->> 'country', 100),
            left(m ->> 'website', 300), left(m ->> 'industry', 120), left(m ->> 'description', 2000),
            'pending');
  end if;
  return new;
end $$;

-- An employer may edit their company details but never its status or owner, and never set who approved it.
create or replace function public.guard_company() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_trusted() and (new.status is distinct from old.status or new.owner_id is distinct from old.owner_id
     or new.approved_by is distinct from old.approved_by or new.approved_at is distinct from old.approved_at) then
    raise exception 'Only an admin can approve a company';
  end if;
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := coalesce(new.approved_at, now());
  end if;
  return new;
end $$;
