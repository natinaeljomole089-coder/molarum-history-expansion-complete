-- Supabase advisor remediation: this internal SECURITY DEFINER helper must not be callable through the public API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
