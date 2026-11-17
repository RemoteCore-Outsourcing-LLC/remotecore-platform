-- Sign up now carries phone, country and expected pay. Profiles get a qualifications field.
alter table public.seeker_profiles add column if not exists qualifications text;

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
  end if;
  return new;
end $$;
