import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from 'lucide-react';

interface LeaveBalance {
  id: string;
  total_quota: number;
  used: number;
  remaining: number;
  leave_type: {
    name: string;
    code: string;
  };
}

export const LeaveBalanceCards = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBalances();
    }
  }, [user]);

  const fetchBalances = async () => {
    const currentYear = new Date().getFullYear();
    const { data, error } = await supabase
      .from('leave_balances' as any)
      .select(`
        *,
        leave_type:leave_types(name, code)
      `)
      .eq('user_id', user?.id)
      .eq('year', currentYear);

    if (!error && data) {
      setBalances(data as any);
    }
    setLoading(false);
  };

  const getProgressColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 66) return 'bg-success';
    if (percentage > 33) return 'bg-warning';
    return 'bg-destructive';
  };

  if (loading) {
    return <div className="text-center py-4">Loading balances...</div>;
  }

  if (balances.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Saldo cuti belum diinisialisasi</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {balances.map((balance) => {
        const percentage = (balance.remaining / balance.total_quota) * 100;
        return (
          <Card key={balance.id} className="hover:shadow-lg transition-shadow border-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {balance.leave_type.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {balance.leave_type.code}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sisa</span>
                  <span className="font-bold text-foreground">
                    {balance.remaining} hari
                  </span>
                </div>

                <Progress 
                  value={percentage} 
                  className="h-2"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Terpakai: {balance.used} hari</span>
                  <span>Total: {balance.total_quota} hari</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
