import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface LeaveStats {
  total: number;
  submitted: number;
  approved_unit: number;
  approved_pusat: number;
  rejected_unit: number;
  rejected_pusat: number;
}

export const LeaveStatistics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<LeaveStats>({
    total: 0,
    submitted: 0,
    approved_unit: 0,
    approved_pusat: 0,
    rejected_unit: 0,
    rejected_pusat: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    const currentYear = new Date().getFullYear();
    const { data, error } = await supabase
      .from('leave_applications')
      .select('status, created_at')
      .eq('user_id', user?.id);

    if (!error && data) {
      const yearData = data.filter(app => 
        new Date(app.created_at).getFullYear() === currentYear
      );

      setStats({
        total: yearData.length,
        submitted: yearData.filter(a => a.status === 'submitted').length,
        approved_unit: yearData.filter(a => a.status === 'approved_unit').length,
        approved_pusat: yearData.filter(a => a.status === 'approved_pusat').length,
        rejected_unit: yearData.filter(a => a.status === 'rejected_unit').length,
        rejected_pusat: yearData.filter(a => a.status === 'rejected_pusat').length,
      });
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-4">Loading statistics...</div>;
  }

  const statsCards = [
    {
      title: 'Total Pengajuan',
      value: stats.total,
      icon: ClipboardCheck,
      color: 'bg-primary',
      description: `${new Date().getFullYear()}`
    },
    {
      title: 'Menunggu Persetujuan',
      value: stats.submitted + stats.approved_unit,
      icon: Clock,
      color: 'bg-warning',
      description: 'Sedang diproses'
    },
    {
      title: 'Disetujui',
      value: stats.approved_pusat,
      icon: CheckCircle,
      color: 'bg-success',
      description: 'Cuti disetujui'
    },
    {
      title: 'Ditolak',
      value: stats.rejected_unit + stats.rejected_pusat,
      icon: XCircle,
      color: 'bg-destructive',
      description: 'Pengajuan ditolak'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow border-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
