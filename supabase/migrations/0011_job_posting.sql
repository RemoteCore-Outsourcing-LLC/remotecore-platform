-- Employer job posts. Every new job, and every change to a job's content, waits for RemoteCore to review it.
-- An employer may pause or close their own job, and turn a paused job back on if nothing changed while it was paused.
create or replace function public.guard_job() returns trigger
language plpgsql security definer set search_path = public as $$
declare changed boolean;
begin
  if not is_trusted() then
    if tg_op = 'INSERT' then
      new.status := case when new.status = 'draft' then 'draft' else 'pending' end;
      new.published_at := null;
    else
      if new.company_id is distinct from old.company_id or new.created_by is distinct from old.created_by then
        raise exception 'This job belongs to another company';
      end if;
      changed := (new.title, new.description, new.skills, new.qualifications, new.experience_level, new.salary_min, new.salary_max,
                  new.salary_currency, new.salary_period, new.employment_type, new.remote_type, new.location_restrictions,
                  new.computer_requirements, new.hours_time_zone, new.deadline, new.category_id, new.documents_required)
             is distinct from
                 (old.title, old.description, old.skills, old.qualifications, old.experience_level, old.salary_min, old.salary_max,
                  old.salary_currency, old.salary_period, old.employment_type, old.remote_type, old.location_restrictions,
                  old.computer_requirements, old.hours_time_zone, old.deadline, old.category_id, old.documents_required);
      new.published_at := old.published_at;
      if new.status = 'published' and old.status <> 'published' then
        -- Only a paused job that RemoteCore already approved, with no changes, can go straight back live.
        if not (old.status = 'paused' and old.published_at is not null and not changed) then
          raise exception 'A job goes live only after RemoteCore approves it';
        end if;
      end if;
      if changed and new.status in ('published', 'paused') then
        new.status := 'pending';
      end if;
    end if;
  end if;
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  new.updated_at := now();
  return new;
end $$;

-- Staffing requests from the dashboard always start as new, and the fee box must be ticked.
create or replace function public.guard_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_trusted() then
    new.status := 'new';
    if not new.fee_acknowledged then raise exception 'Please confirm the placement fee'; end if;
  end if;
  return new;
end $$;
drop trigger if exists staffing_requests_guard on public.staffing_requests;
create trigger staffing_requests_guard before insert on public.staffing_requests for each row execute function public.guard_request();
