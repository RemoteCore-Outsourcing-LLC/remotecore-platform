-- Every status change puts a notification in the job seeker's dashboard, whoever made the change.
create or replace function public.notify_status_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text; msg text; ttl text;
begin
  if new.status is not distinct from old.status then return new; end if;
  select title into t from jobs where id = new.job_id;
  ttl := case new.status
    when 'under_review' then 'Your application is under review'
    when 'shortlisted' then 'You were shortlisted'
    when 'interview_stage' then 'You moved to the interview stage'
    when 'selected' then 'You were selected'
    when 'not_selected' then 'An update on your application'
    when 'position_filled' then 'This position has been filled'
    else 'Your application was updated' end;
  msg := coalesce(t, 'Your application') || case new.status
    when 'not_selected' then ': the employer chose another candidate this time.'
    when 'position_filled' then ': this position has now been filled.'
    else '.' end;
  insert into notifications (user_id, title, body, link) values (new.seeker_id, ttl, msg, '/portal/applications');
  return new;
end $$;
drop trigger if exists applications_notify on public.applications;
create trigger applications_notify after update on public.applications for each row execute function public.notify_status_change();
