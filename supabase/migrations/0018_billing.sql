-- Billing: fee types the team sets up, invoices to employers, and every card payment and refund.
-- The server writes invoices and payments (Stripe confirms them); employers only read their own.

create table if not exists public.fee_types (
  id serial primary key,
  name text not null unique check (char_length(name) between 2 and 80),
  kind text not null default 'fixed' check (kind in ('fixed', 'percent')),
  default_cents int check (default_cents is null or default_cents between 0 and 100000000),
  default_percent numeric(5, 2) check (default_percent is null or default_percent between 0 and 100),
  description text check (char_length(description) <= 300),
  active boolean not null default true,
  sort int not null default 0
);
insert into public.fee_types (name, kind, description, sort) values
  ('Placement fee', 'fixed', 'Fee for a successful hire', 1),
  ('Deposit', 'fixed', 'Paid before recruitment starts, taken off the placement fee', 2),
  ('Service fee', 'fixed', 'Any other agreed service', 3)
on conflict (name) do nothing;

create sequence if not exists public.invoice_number_seq start 1001;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('RC-' || nextval('public.invoice_number_seq')),
  company_id uuid not null references public.companies (id) on delete restrict,
  created_by uuid references public.profiles (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'open', 'paid', 'void', 'refunded', 'partially_refunded')),
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  description text not null check (char_length(description) between 2 and 200),
  note text check (char_length(note) <= 1000),
  amount_cents int not null check (amount_cents between 50 and 100000000),
  refunded_cents int not null default 0 check (refunded_cents >= 0),
  due_date date,
  stripe_session_id text,
  stripe_payment_intent text,
  receipt_url text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists invoices_company_idx on public.invoices (company_id, created_at desc);
create index if not exists invoices_status_idx on public.invoices (status, created_at desc);

create table if not exists public.invoice_items (
  id bigserial primary key,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  fee_type_id int references public.fee_types (id) on delete set null,
  description text not null check (char_length(description) between 1 and 200),
  amount_cents int not null check (amount_cents between 0 and 100000000)
);
create index if not exists invoice_items_invoice_idx on public.invoice_items (invoice_id);

-- Every money movement, as Stripe reported it. Amounts are positive; type says the direction.
create table if not exists public.payments (
  id bigserial primary key,
  invoice_id uuid not null references public.invoices (id) on delete restrict,
  company_id uuid not null references public.companies (id) on delete restrict,
  type text not null check (type in ('payment', 'refund')),
  amount_cents int not null check (amount_cents > 0),
  currency text not null,
  stripe_id text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists payments_company_idx on public.payments (company_id, created_at desc);
create index if not exists payments_created_idx on public.payments (created_at desc);

alter table public.fee_types enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

drop policy if exists "fees admin" on public.fee_types;
create policy "fees admin" on public.fee_types for all using (is_admin()) with check (is_admin());

drop policy if exists "invoices read" on public.invoices;
create policy "invoices read" on public.invoices for select using (
  is_admin() or (status <> 'draft' and company_id = my_company_id()));
drop policy if exists "items read" on public.invoice_items;
create policy "items read" on public.invoice_items for select using (
  exists (select 1 from invoices i where i.id = invoice_id));  -- follows the invoices policy
drop policy if exists "payments read" on public.payments;
create policy "payments read" on public.payments for select using (is_admin() or company_id = my_company_id());
-- No insert, update or delete policies: only the server (service key) writes billing rows.
