-- =================================================================
-- FIX: API Mismatch Wrapper
-- Creates public views and functions to match Frontend expectations
-- =================================================================

-- 1. Wrapper for Profiles
-- Frontend expects 'hub_profiles', DB has 'hub.profiles'
CREATE OR REPLACE VIEW public.hub_profiles AS
SELECT * FROM hub.profiles;

-- Allow permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_profiles TO service_role;


-- 2. Wrapper for Applications
-- Frontend expects 'hub_apps', DB has 'hub.applications'
CREATE OR REPLACE VIEW public.hub_apps AS
SELECT * FROM hub.applications;

-- Allow permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_apps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_apps TO service_role;


-- 3. Wrapper for RPC Function
-- Frontend calls 'hub_get_user_applications', DB has 'hub.get_user_applications'
CREATE OR REPLACE FUNCTION public.hub_get_user_applications()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    icon TEXT,
    color TEXT,
    port INTEGER,
    base_url TEXT,
    display_order INTEGER,
    access_level hub.access_level
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM hub.get_user_applications();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.hub_get_user_applications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hub_get_user_applications() TO service_role;

-- 4. Verify
DO $$
BEGIN
    RAISE NOTICE '✅ API Wrappers created successfully';
    RAISE NOTICE '👉 exposed: hub_profiles, hub_apps, hub_get_user_applications';
END $$;
