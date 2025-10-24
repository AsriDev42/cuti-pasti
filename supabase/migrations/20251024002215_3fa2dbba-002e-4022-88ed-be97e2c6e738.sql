-- Create leave_applications table
CREATE TABLE IF NOT EXISTS public.leave_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  leave_address TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  document_links TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved_unit', 'approved_pusat', 'rejected_unit', 'rejected_pusat', 'cancelled')),
  unit_admin_notes TEXT,
  pusat_admin_notes TEXT,
  reviewed_by_unit UUID REFERENCES auth.users(id),
  reviewed_by_pusat UUID REFERENCES auth.users(id),
  reviewed_at_unit TIMESTAMP WITH TIME ZONE,
  reviewed_at_pusat TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leave_balances table
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
  year INTEGER NOT NULL,
  total_quota INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  remaining INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, leave_type_id, year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leave_applications_user_id ON public.leave_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_applications_status ON public.leave_applications(status);
CREATE INDEX IF NOT EXISTS idx_leave_applications_leave_type_id ON public.leave_applications(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_user_id ON public.leave_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON public.leave_balances(year);

-- Enable RLS
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_applications

-- Users can view their own leave applications
CREATE POLICY "Users can view their own leave applications"
ON public.leave_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own leave applications
CREATE POLICY "Users can insert their own leave applications"
ON public.leave_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending leave applications (for cancellation)
CREATE POLICY "Users can cancel their own pending applications"
ON public.leave_applications
FOR UPDATE
USING (auth.uid() = user_id AND status = 'submitted');

-- Admin Unit can view leave applications in their unit
CREATE POLICY "Admin Unit can view leave applications in their unit"
ON public.leave_applications
FOR SELECT
USING (
  has_role(auth.uid(), 'admin_unit'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.id = auth.uid() 
    AND p2.id = leave_applications.user_id
    AND p1.unit_id = p2.unit_id
  )
);

-- Admin Unit can update leave applications in their unit
CREATE POLICY "Admin Unit can update leave applications in their unit"
ON public.leave_applications
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin_unit'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.id = auth.uid() 
    AND p2.id = leave_applications.user_id
    AND p1.unit_id = p2.unit_id
  )
);

-- Admin Pusat can view all leave applications
CREATE POLICY "Admin Pusat can view all leave applications"
ON public.leave_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin_pusat'::app_role));

-- Admin Pusat can update all leave applications
CREATE POLICY "Admin Pusat can update all leave applications"
ON public.leave_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin_pusat'::app_role));

-- RLS Policies for leave_balances

-- Users can view their own leave balances
CREATE POLICY "Users can view their own leave balances"
ON public.leave_balances
FOR SELECT
USING (auth.uid() = user_id);

-- Admin Pusat can manage all leave balances
CREATE POLICY "Admin Pusat can manage all leave balances"
ON public.leave_balances
FOR ALL
USING (has_role(auth.uid(), 'admin_pusat'::app_role));

-- Admin Unit can view leave balances in their unit
CREATE POLICY "Admin Unit can view leave balances in their unit"
ON public.leave_balances
FOR SELECT
USING (
  has_role(auth.uid(), 'admin_unit'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.id = auth.uid() 
    AND p2.id = leave_balances.user_id
    AND p1.unit_id = p2.unit_id
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_leave_applications_updated_at
BEFORE UPDATE ON public.leave_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
BEFORE UPDATE ON public.leave_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();