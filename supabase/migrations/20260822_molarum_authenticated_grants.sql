grant usage on schema public to authenticated;
grant select, update on table public.molarum_profiles to authenticated;
grant select on table public.molarum_roles to authenticated;
grant select, insert, update, delete on table public.molarum_attempts to authenticated;
grant select, insert, update, delete on table public.molarum_question_banks to authenticated;
grant select, insert, update, delete on table public.molarum_review_states to authenticated;
