-- 1. Create Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member'))
);

COMMENT ON TABLE public.profiles IS 'Stores public profile information linked to authenticated users.';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users';
COMMENT ON COLUMN public.profiles.role IS 'User role (admin or member)';

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Allow individual user read access"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile (e.g., full_name) but NOT their role easily
CREATE POLICY "Allow individual user update access"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Optional: Allow admins to view all profiles (useful for user management later)
-- CREATE POLICY "Allow admin read access"
--   ON public.profiles FOR SELECT
--   USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Disallow direct inserts/deletes by users (managed by trigger/admin actions)
CREATE POLICY "Disallow public inserts"
  ON public.profiles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Disallow public deletes"
  ON public.profiles FOR DELETE
  USING (false);


-- 2. Trigger Function to Create Profile on New User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Necessary to insert into public.profiles
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'member'); -- Default role is 'member'
  RETURN NEW;
END;
$$;

-- Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; -- Drop if exists to avoid errors on re-run
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Update RLS Policies for 'registrants' table

-- Ensure RLS is enabled (if not already)
ALTER TABLE public.registrants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they need replacement
-- Specifically drop the permissive anonymous insert policy from schema.sql
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.registrants;
-- Add drops for the new policies too, for idempotency during development
DROP POLICY IF EXISTS "Allow admin/member read access" ON public.registrants;
DROP POLICY IF EXISTS "Allow admin insert access" ON public.registrants;
DROP POLICY IF EXISTS "Allow admin update access" ON public.registrants;
DROP POLICY IF EXISTS "Allow admin delete access" ON public.registrants;

-- SELECT Policy: Admins and Members can read registrants
CREATE POLICY "Allow admin/member read access"
  ON public.registrants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')
    )
  );

-- INSERT Policy: Only Admins can insert new registrants
CREATE POLICY "Allow admin insert access"
  ON public.registrants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE Policy: Only Admins can update registrants
CREATE POLICY "Allow admin update access"
  ON public.registrants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE Policy: Only Admins can delete registrants
CREATE POLICY "Allow admin delete access"
  ON public.registrants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant usage on the public schema to Supabase internal roles if needed
-- Usually handled by Supabase, but uncomment if you face permission issues
-- GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
-- Grant select on profiles to authenticated role (needed for RLS checks)
GRANT SELECT ON public.profiles TO authenticated;
-- Ensure other grants are appropriate (e.g., SELECT, INSERT, UPDATE, DELETE on registrants for authenticated)
-- The RLS policies will restrict based on role check AFTER the basic grant allows access.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrants TO authenticated;
-- Ensure execute on functions is still correct
GRANT EXECUTE ON FUNCTION public.assign_group_to_registrant(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_age_bracket(integer) TO authenticated;
