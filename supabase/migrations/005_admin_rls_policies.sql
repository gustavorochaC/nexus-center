-- Migration: Row Level Security Policies for Admin Access Control
-- Execute AFTER 004_validate_auth_schema.sql

-- ============================================
-- HELPER FUNCTION: Check if current user is admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.hub_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DROP EXISTING POLICIES (clean slate)
-- ============================================
DROP POLICY IF EXISTS "users_read_own_profile" ON public.hub_profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON public.hub_profiles;
DROP POLICY IF EXISTS "admins_update_profiles" ON public.hub_profiles;
DROP POLICY IF EXISTS "admins_manage_permissions" ON public.hub_app_permissions;
DROP POLICY IF EXISTS "users_read_own_permissions" ON public.hub_app_permissions;
DROP POLICY IF EXISTS "all_read_apps" ON public.hub_apps;
DROP POLICY IF EXISTS "admins_manage_apps" ON public.hub_apps;

-- ============================================
-- HUB_PROFILES POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "users_read_own_profile" ON public.hub_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can read ALL profiles
CREATE POLICY "admins_read_all_profiles" ON public.hub_profiles
  FOR SELECT
  USING (public.is_admin());

-- Admins can update any profile (change roles)
CREATE POLICY "admins_update_profiles" ON public.hub_profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- HUB_APP_PERMISSIONS POLICIES
-- ============================================

-- Users can read their own permissions
CREATE POLICY "users_read_own_permissions" ON public.hub_app_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can do everything with permissions
CREATE POLICY "admins_manage_permissions" ON public.hub_app_permissions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- HUB_APPS POLICIES
-- ============================================

-- Everyone can read apps list
CREATE POLICY "all_read_apps" ON public.hub_apps
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete apps
CREATE POLICY "admins_manage_apps" ON public.hub_apps
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
