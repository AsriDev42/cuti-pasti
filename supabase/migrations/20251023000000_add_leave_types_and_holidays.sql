-- Add leave_types and holidays tables for admin configuration

-- =====================================================
-- LEAVE TYPES TABLE
-- =====================================================

CREATE TABLE public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  default_quota INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  requires_document BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default leave types
INSERT INTO public.leave_types (name, code, default_quota, description, requires_document) VALUES
  ('Cuti Tahunan', 'CT', 12, 'Cuti tahunan yang diberikan setiap tahun', false),
  ('Cuti Sakit', 'CS', 0, 'Cuti karena sakit dengan surat dokter', true),
  ('Cuti Melahirkan', 'CM', 90, 'Cuti melahirkan untuk pegawai perempuan', true),
  ('Cuti Alasan Penting', 'CAP', 0, 'Cuti karena alasan penting/mendesak', false),
  ('Cuti Besar', 'CB', 90, 'Cuti besar setelah 6 tahun masa kerja', false),
  ('Cuti di Luar Tanggungan Negara', 'CLTN', 0, 'Cuti di luar tanggungan negara', false);

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leave types are viewable by authenticated users"
  ON public.leave_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin Pusat can manage leave types"
  ON public.leave_types FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_pusat'));

-- =====================================================
-- HOLIDAYS TABLE
-- =====================================================

CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('national', 'collective', 'custom')),
  is_recurring BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert some default holidays for 2025
INSERT INTO public.holidays (date, name, type, is_recurring) VALUES
  ('2025-01-01', 'Tahun Baru Masehi', 'national', true),
  ('2025-03-29', 'Hari Raya Nyepi', 'national', false),
  ('2025-03-31', 'Isra Miraj Nabi Muhammad SAW', 'national', false),
  ('2025-04-18', 'Wafat Isa Al Masih', 'national', false),
  ('2025-05-01', 'Hari Buruh Internasional', 'national', true),
  ('2025-05-29', 'Kenaikan Isa Al Masih', 'national', false),
  ('2025-06-01', 'Hari Lahir Pancasila', 'national', true),
  ('2025-08-17', 'Hari Kemerdekaan RI', 'national', true),
  ('2025-12-25', 'Hari Raya Natal', 'national', true);

CREATE INDEX idx_holidays_date ON public.holidays(date);
CREATE INDEX idx_holidays_type ON public.holidays(type);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Holidays are viewable by authenticated users"
  ON public.holidays FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin Pusat can manage holidays"
  ON public.holidays FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_pusat'));

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_leave_types_updated_at
  BEFORE UPDATE ON public.leave_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at
  BEFORE UPDATE ON public.holidays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
