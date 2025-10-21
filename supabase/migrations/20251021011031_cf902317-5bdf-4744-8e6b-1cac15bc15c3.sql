-- FASE 1: Foundation & Authentication (Fixed)
-- Database schema untuk SI CUTI - Sistem Informasi Cuti ASN

-- =====================================================
-- 1. ENUM TYPES
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('user', 'admin_unit', 'admin_pusat');
CREATE TYPE public.user_status AS ENUM ('pending_approval', 'active', 'inactive', 'rejected');

-- =====================================================
-- 2. UNITS TABLE
-- =====================================================

CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  description TEXT,
  head_name TEXT,
  head_nip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.units (name, code) VALUES
  ('Sekretariat Ditjen Binalavotas', 'SETDITJEN'),
  ('Direktorat Standardisasi Kompetensi dan Pelatihan Kerja', 'DIR-SKPK'),
  ('Direktorat Bina Pelatihan Vokasi', 'DIR-BPV'),
  ('Direktorat Bina Produktivitas', 'DIR-BP'),
  ('Direktorat Pembinaan Kelembagaan Pelatihan Vokasi', 'DIR-PKLPV');

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Units are viewable by authenticated users"
  ON public.units FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 3. PROFILES TABLE
-- =====================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nip TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  position TEXT NOT NULL,
  rank TEXT NOT NULL,
  join_date DATE,
  address TEXT,
  avatar_url TEXT,
  status public.user_status DEFAULT 'pending_approval',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- =====================================================
-- 4. USER_ROLES TABLE
-- =====================================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. ROLE CHECK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =====================================================
-- 6. ADD REMAINING RLS POLICIES (after user_roles exists)
-- =====================================================

CREATE POLICY "Admin Pusat can manage units"
  ON public.units FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Unit can view profiles in their unit"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = auth.uid()
      WHERE ur.role = 'admin_unit' AND p.unit_id = profiles.unit_id
    )
    OR public.has_role(auth.uid(), 'admin_pusat')
  );

CREATE POLICY "Admin Pusat can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_pusat'));

-- =====================================================
-- 7. TRIGGERS FOR PROFILE CREATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, nip, full_name, email, phone, unit_id,
    position, rank, join_date, address, status
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nip',
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'unit_id')::UUID,
    NEW.raw_user_meta_data->>'position',
    NEW.raw_user_meta_data->>'rank',
    (NEW.raw_user_meta_data->>'join_date')::DATE,
    NEW.raw_user_meta_data->>'address',
    'pending_approval'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 8. UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 9. USER ACTIVITY LOG
-- =====================================================

CREATE TABLE public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity log"
  ON public.user_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin Pusat can view all activity logs"
  ON public.user_activity_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_pusat'));

-- =====================================================
-- 10. PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX idx_profiles_unit_id ON public.profiles(unit_id);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_nip ON public.profiles(nip);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);