import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLeaveBalance = () => {
  const { toast } = useToast();

  const updateLeaveBalance = async (
    userId: string,
    leaveTypeId: string,
    totalDays: number,
    action: 'deduct' | 'restore'
  ) => {
    const currentYear = new Date().getFullYear();

    // Get current balance
    const { data: balance, error: fetchError } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('leave_type_id', leaveTypeId)
      .eq('year', currentYear)
      .single();

    if (fetchError || !balance) {
      console.error('Failed to fetch leave balance:', fetchError);
      return { success: false, error: fetchError };
    }

    // Calculate new values
    let newUsed = balance.used;
    let newRemaining = balance.remaining;

    if (action === 'deduct') {
      newUsed = balance.used + totalDays;
      newRemaining = balance.remaining - totalDays;

      if (newRemaining < 0) {
        return { 
          success: false, 
          error: { message: 'Saldo cuti tidak mencukupi' }
        };
      }
    } else if (action === 'restore') {
      newUsed = Math.max(0, balance.used - totalDays);
      newRemaining = Math.min(balance.total_quota, balance.remaining + totalDays);
    }

    // Update balance
    const { error: updateError } = await supabase
      .from('leave_balances')
      .update({
        used: newUsed,
        remaining: newRemaining
      })
      .eq('id', balance.id);

    if (updateError) {
      console.error('Failed to update leave balance:', updateError);
      return { success: false, error: updateError };
    }

    return { success: true };
  };

  return { updateLeaveBalance };
};
