-- The UI uses the branch-scoped overload with split_print. Keep the legacy
-- four-argument function for compatibility, but do not allow it to execute.
REVOKE ALL ON FUNCTION public.save_category_print_route(uuid, boolean, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_category_print_routes(jsonb, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_category_print_route(uuid, boolean, text, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_category_print_routes(jsonb, uuid) TO authenticated;
