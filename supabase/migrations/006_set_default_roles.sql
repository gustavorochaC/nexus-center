-- Migration: Set default roles for existing users
-- Execute AFTER 005_admin_rls_policies.sql

-- 1. Set all users without role to 'user' by default
UPDATE public.hub_profiles 
SET role = 'user' 
WHERE role IS NULL OR role = '';

-- 2. Confirm admin for the primary admin user
UPDATE public.hub_profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'vaccontatos@hotmail.com';

-- 3. Verify the setup
SELECT id, email, role, created_at 
FROM public.hub_profiles 
ORDER BY role DESC, email ASC;
