-- Restrict has_role() to authenticated users only, preventing anonymous role enumeration
REVOKE EXECUTE ON FUNCTION public.has_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;