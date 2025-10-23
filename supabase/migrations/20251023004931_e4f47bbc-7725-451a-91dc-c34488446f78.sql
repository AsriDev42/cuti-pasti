-- Create leave_types table
CREATE TABLE IF NOT EXISTS public.leave_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  default_quota INTEGER NOT NULL DEFAULT 12,
  description TEXT,
  requires_document BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create holidays table
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'national',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_types (read by all, write by admin_pusat only)
CREATE POLICY "Anyone can view leave types"
ON public.leave_types
FOR SELECT
USING (true);

CREATE POLICY "Admin Pusat can insert leave types"
ON public.leave_types
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_pusat'
  )
);

CREATE POLICY "Admin Pusat can update leave types"
ON public.leave_types
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_pusat'
  )
);

CREATE POLICY "Admin Pusat can delete leave types"
ON public.leave_types
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_pusat'
  )
);

-- RLS Policies for holidays (read by all, write by admin_pusat only)
CREATE POLICY "Anyone can view holidays"
ON public.holidays
FOR SELECT
USING (true);

CREATE POLICY "Admin Pusat can insert holidays"
ON public.holidays
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_pusat'
  )
);

CREATE POLICY "Admin Pusat can update holidays"
ON public.holidays
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_pusat'
  )
);

CREATE POLICY "Admin Pusat can delete holidays"
ON public.holidays
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_pusat'
  )
);

-- Insert default leave types
INSERT INTO public.leave_types (name, code, default_quota, description, requires_document) VALUES
('Cuti Tahunan', 'TAHUNAN', 12, 'Cuti tahunan ASN sesuai peraturan', false),
('Cuti Sakit', 'SAKIT', 0, 'Cuti karena sakit dengan surat dokter', true),
('Cuti Besar', 'BESAR', 3, 'Cuti besar untuk masa kerja tertentu', false),
('Cuti Melahirkan', 'MELAHIRKAN', 3, 'Cuti melahirkan untuk ASN perempuan', true),
('Cuti Alasan Penting', 'PENTING', 0, 'Cuti untuk keperluan mendesak', true)
ON CONFLICT (code) DO NOTHING;