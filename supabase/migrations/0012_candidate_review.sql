-- Employer candidate review.
-- Employers move an application's status on their own jobs, and nothing else about it.
-- This matters for files: the server signs links from applications.resume_path and extra_documents,
-- so nobody but the server may ever rewrite those paths, the job or the job seeker.
create or replace function public.guard_application() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_trusted() then return new; end if;
  if new.status is distinct from old.status
     and not exists (select 1 from jobs j where j.id = new.job_id and j.company_id = my_company_id()) then
    raise exception 'You cannot change this status';
  end if;
  if (new.note, new.resume_path, new.extra_documents, new.job_id, new.seeker_id)
     is distinct from (old.note, old.resume_path, old.extra_documents, old.job_id, old.seeker_id) then
    raise exception 'A sent application cannot be changed';
  end if;
  return new;
end $$;

-- Applicants per job is the employer's main list.
create index if not exists applications_job_idx on public.applications (job_id, updated_at desc);
