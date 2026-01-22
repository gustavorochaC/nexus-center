-- Migration: Validate and setup auth schema for role-based access
-- Execute this migration first

-- 1. Ensure RLS is enabled on all tables
ALTER TABLE public.hub_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_apps ENABLE ROW LEVEL SECURITY;

-- 2. Add constraint for role enum (if not exists)
DO $$ 
BEGIN
  -- Check if constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hub_profiles_role_check'
  ) THEN
    ALTER TABLE public.hub_profiles 
    ADD CONSTRAINT hub_profiles_role_check 
    CHECK (role IN ('admin', 'user'));
  END IF;
END $$;

-- 3. Set default role for new users
ALTER TABLE public.hub_profiles 
ALTER COLUMN role SET DEFAULT 'user';

-- 4. Create index for performance on role queries
CREATE INDEX IF NOT EXISTS idx_hub_profiles_role 
ON public.hub_profiles(role);

-- 5. Create index for auth.uid lookups
CREATE INDEX IF NOT EXISTS idx_hub_profiles_id 
ON public.hub_profiles(id);
