-- Deleting an account must never fail because that person once approved, changed or shared something.
-- These links become empty instead. (Jobs keep their author, so an admin deletes or reassigns jobs first.)
alter table public.companies drop constraint companies_approved_by_fkey,
  add constraint companies_approved_by_fkey foreign key (approved_by) references public.profiles (id) on delete set null;
alter table public.application_status_history drop constraint application_status_history_changed_by_fkey,
  add constraint application_status_history_changed_by_fkey foreign key (changed_by) references public.profiles (id) on delete set null;
alter table public.candidate_shares drop constraint candidate_shares_shared_by_fkey,
  add constraint candidate_shares_shared_by_fkey foreign key (shared_by) references public.profiles (id) on delete set null;
alter table public.staffing_requests drop constraint staffing_requests_created_by_fkey,
  add constraint staffing_requests_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;
alter table public.admin_log drop constraint admin_log_actor_id_fkey,
  add constraint admin_log_actor_id_fkey foreign key (actor_id) references public.profiles (id) on delete set null;
