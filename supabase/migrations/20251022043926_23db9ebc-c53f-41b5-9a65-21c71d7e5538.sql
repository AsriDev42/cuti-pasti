-- Fix infinite recursion in profiles RLS policies

-- Drop problematic policy
DROP POLICY IF EXISTS "Admin Unit can view profiles in their unit" ON public.profiles;

-- Create security definer function to get user's unit
CREATE OR REPLACE FUNCTION public.get_user_unit_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_id FROM public.profiles WHERE id = _user_id;
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Admin Unit can view profiles in their unit"
  ON public.profiles FOR SELECT
  USING (
    (
      public.has_role(auth.uid(), 'admin_unit') AND
      unit_id = public.get_user_unit_id(auth.uid())
    ) OR
    public.has_role(auth.uid(), 'admin_pusat')
  );