-- Applying for a job.
-- documents_required: what extra files the job asks for (empty = none needed, the applicant may still add some).
alter table public.jobs add column if not exists documents_required text;

-- After applying, the job seeker cannot rewrite their application (only employers and admins move it forward).
create or replace function public.guard_application() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_trusted() then return new; end if;
  if new.status is distinct from old.status
     and not exists (select 1 from jobs j where j.id = new.job_id and j.company_id = my_company_id()) then
    raise exception 'You cannot change this status';
  end if;
  if new.seeker_id = auth.uid() and (new.note is distinct from old.note or new.resume_path is distinct from old.resume_path
     or new.extra_documents is distinct from old.extra_documents or new.job_id is distinct from old.job_id) then
    raise exception 'A sent application cannot be changed';
  end if;
  return new;
end $$;
