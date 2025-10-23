-- Update existing profiles with NULL unit_id to a default unit (Sekretariat Ditjen)
UPDATE public.profiles 
SET unit_id = (SELECT id FROM public.units WHERE code = 'SEKT-DITJEN' LIMIT 1)
WHERE unit_id IS NULL;

-- Add helper function to get user's unit_id (if not exists)
CREATE OR REPLACE FUNCTION public.get_user_unit_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT unit_id FROM public.profiles WHERE id = _user_id;
$$;

-- Update RLS policies for profiles table to support Admin Unit access control
DROP POLICY IF EXISTS "Admin Unit can view profiles in their unit" ON public.profiles;

CREATE POLICY "Admin Unit can view profiles in their unit"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND unit_id = get_user_unit_id(auth.uid())
);

DROP POLICY IF EXISTS "Admin Unit can update profiles in their unit" ON public.profiles;

CREATE POLICY "Admin Unit can update profiles in their unit"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND unit_id = get_user_unit_id(auth.uid())
);

-- Ensure profiles have proper constraints
ALTER TABLE public.profiles 
  ALTER COLUMN unit_id SET NOT NULL;

-- Add index for better query performance on unit_id
CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON public.profiles(unit_id);

-- Add foreign key constraint to ensure data integrity
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS fk_profiles_unit_id;

ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_unit_id 
  FOREIGN KEY (unit_id) 
  REFERENCES public.units(id) 
  ON DELETE RESTRICT;

COMMENT ON COLUMN public.profiles.unit_id IS 'Unit kerja pegawai - digunakan untuk kontrol akses Admin Unit';