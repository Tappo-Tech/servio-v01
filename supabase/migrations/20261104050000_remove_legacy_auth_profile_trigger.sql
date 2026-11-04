-- Registration now provisions the tenant/store/profile atomically through
-- ensure_profile_for_current_user() after Auth creates the user.
-- The legacy AFTER INSERT trigger attempted to insert profiles before a tenant
-- existed and caused the generic registration failure.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
