-- Molarum optional cloud layer. Applied through the Supabase Management API.
-- The client receives only a publishable key; all authority derives from RLS.

create extension if not exists pgcrypto;

create table if not exists public.molarum_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  class_name text,
  school text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.molarum_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('learner', 'teacher')) default 'learner',
  created_at timestamptz not null default now()
);

create table if not exists public.molarum_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_attempt_id text not null,
  unit_key text not null,
  unit_title text not null,
  completed_at timestamptz not null,
  correct integer not null check (correct >= 0),
  total integer not null check (total > 0 and correct <= total),
  timed boolean not null default false,
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, local_attempt_id)
);

create table if not exists public.molarum_question_banks (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  source_catalog_version text not null,
  bank jsonb not null,
  validation_report jsonb not null,
  is_active boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists molarum_one_active_question_bank
  on public.molarum_question_banks (is_active) where is_active;

create table if not exists public.molarum_review_states (
  bank_id uuid not null references public.molarum_question_banks(id) on delete cascade,
  question_id text not null,
  state text not null check (state in ('draft', 'approved', 'hidden')),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (bank_id, question_id)
);

create or replace function public.molarum_is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.molarum_roles
    where user_id = (select auth.uid()) and role = 'teacher'
  );
$$;

create or replace function public.molarum_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.molarum_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.molarum_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;

  insert into public.molarum_roles (user_id, role)
  values (
    new.id,
    case when lower(coalesce(new.email, '')) = 'natijommar@gmail.com' then 'teacher' else 'learner' end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists molarum_profiles_updated_at on public.molarum_profiles;
create trigger molarum_profiles_updated_at before update on public.molarum_profiles
for each row execute function public.molarum_set_updated_at();

drop trigger if exists molarum_attempts_updated_at on public.molarum_attempts;
create trigger molarum_attempts_updated_at before update on public.molarum_attempts
for each row execute function public.molarum_set_updated_at();

drop trigger if exists molarum_question_banks_updated_at on public.molarum_question_banks;
create trigger molarum_question_banks_updated_at before update on public.molarum_question_banks
for each row execute function public.molarum_set_updated_at();

drop trigger if exists molarum_on_auth_user_created on auth.users;
create trigger molarum_on_auth_user_created after insert on auth.users
for each row execute procedure public.molarum_handle_new_user();

alter table public.molarum_profiles enable row level security;
alter table public.molarum_roles enable row level security;
alter table public.molarum_attempts enable row level security;
alter table public.molarum_question_banks enable row level security;
alter table public.molarum_review_states enable row level security;

create policy "molarum_profiles_owner_select" on public.molarum_profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "molarum_profiles_owner_update" on public.molarum_profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "molarum_roles_owner_select" on public.molarum_roles
for select to authenticated using ((select auth.uid()) = user_id);

create policy "molarum_attempts_owner_select" on public.molarum_attempts
for select to authenticated using ((select auth.uid()) = user_id);
create policy "molarum_attempts_owner_insert" on public.molarum_attempts
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "molarum_attempts_owner_update" on public.molarum_attempts
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "molarum_attempts_owner_delete" on public.molarum_attempts
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "molarum_banks_read_active" on public.molarum_question_banks
for select to authenticated using (is_active or (select public.molarum_is_teacher()));
create policy "molarum_banks_teacher_insert" on public.molarum_question_banks
for insert to authenticated with check ((select public.molarum_is_teacher()) and created_by = (select auth.uid()));
create policy "molarum_banks_teacher_update" on public.molarum_question_banks
for update to authenticated using ((select public.molarum_is_teacher()))
with check ((select public.molarum_is_teacher()));
create policy "molarum_banks_teacher_delete" on public.molarum_question_banks
for delete to authenticated using ((select public.molarum_is_teacher()));

create policy "molarum_review_read" on public.molarum_review_states
for select to authenticated using (true);
create policy "molarum_review_teacher_insert" on public.molarum_review_states
for insert to authenticated with check ((select public.molarum_is_teacher()) and updated_by = (select auth.uid()));
create policy "molarum_review_teacher_update" on public.molarum_review_states
for update to authenticated using ((select public.molarum_is_teacher()))
with check ((select public.molarum_is_teacher()) and updated_by = (select auth.uid()));
create policy "molarum_review_teacher_delete" on public.molarum_review_states
for delete to authenticated using ((select public.molarum_is_teacher()));

insert into storage.buckets (id, name, public)
values ('molarum-source-materials', 'molarum-source-materials', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('molarum-learner-reports', 'molarum-learner-reports', false)
on conflict (id) do nothing;

create policy "molarum_sources_teacher_read" on storage.objects
for select to authenticated using (bucket_id = 'molarum-source-materials' and (select public.molarum_is_teacher()));
create policy "molarum_sources_teacher_insert" on storage.objects
for insert to authenticated with check (bucket_id = 'molarum-source-materials' and (select public.molarum_is_teacher()));
create policy "molarum_sources_teacher_update" on storage.objects
for update to authenticated using (bucket_id = 'molarum-source-materials' and (select public.molarum_is_teacher()))
with check (bucket_id = 'molarum-source-materials' and (select public.molarum_is_teacher()));
create policy "molarum_sources_teacher_delete" on storage.objects
for delete to authenticated using (bucket_id = 'molarum-source-materials' and (select public.molarum_is_teacher()));

create policy "molarum_reports_owner_read" on storage.objects
for select to authenticated using (bucket_id = 'molarum-learner-reports' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "molarum_reports_owner_insert" on storage.objects
for insert to authenticated with check (bucket_id = 'molarum-learner-reports' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "molarum_reports_owner_update" on storage.objects
for update to authenticated using (bucket_id = 'molarum-learner-reports' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'molarum-learner-reports' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "molarum_reports_owner_delete" on storage.objects
for delete to authenticated using (bucket_id = 'molarum-learner-reports' and (storage.foldername(name))[1] = (select auth.uid())::text);
