import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Users, Calendar, Clock } from 'lucide-react';

interface MonthlyStats {
  month: string;
  submitted: number;
  approved: number;
  rejected: number;
}

interface UnitStats {
  name: string;
  total: number;
}

export const AdminLeaveStatistics = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [unitData, setUnitData] = useState<UnitStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    const currentYear = new Date().getFullYear();
    
    // Fetch all applications for current year
    const { data: applications } = await supabase
      .from('leave_applications')
      .select(`
        *,
        profiles!leave_applications_user_id_fkey(
          unit:units(name)
        )
      `)
      .gte('created_at', `${currentYear}-01-01`)
      .lte('created_at', `${currentYear}-12-31`);

    if (applications) {
      // Calculate total stats
      setTotalStats({
        total: applications.length,
        pending: applications.filter(a => 
          a.status === 'submitted' || a.status === 'approved_unit'
        ).length,
        approved: applications.filter(a => a.status === 'approved_pusat').length,
        rejected: applications.filter(a => 
          a.status === 'rejected_unit' || a.status === 'rejected_pusat'
        ).length
      });

      // Calculate monthly data
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      
      const monthlyStats = months.map((month, index) => {
        const monthApps = applications.filter(app => 
          new Date(app.created_at).getMonth() === index
        );
        return {
          month,
          submitted: monthApps.length,
          approved: monthApps.filter(a => a.status === 'approved_pusat').length,
          rejected: monthApps.filter(a => 
            a.status === 'rejected_unit' || a.status === 'rejected_pusat'
          ).length
        };
      });
      setMonthlyData(monthlyStats);

      // Calculate unit data
      const unitMap = new Map<string, number>();
      applications.forEach(app => {
        const unitName = (app.profiles as any)?.unit?.name || 'Unknown';
        unitMap.set(unitName, (unitMap.get(unitName) || 0) + 1);
      });
      
      const unitStats = Array.from(unitMap.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setUnitData(unitStats);
    }

    setLoading(false);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const summaryCards = [
    {
      title: 'Total Pengajuan',
      value: totalStats.total,
      icon: Calendar,
      color: 'bg-primary',
      description: `Tahun ${new Date().getFullYear()}`
    },
    {
      title: 'Pending',
      value: totalStats.pending,
      icon: Clock,
      color: 'bg-warning',
      description: 'Menunggu approval'
    },
    {
      title: 'Disetujui',
      value: totalStats.approved,
      icon: TrendingUp,
      color: 'bg-success',
      description: 'Cuti disetujui'
    },
    {
      title: 'Ditolak',
      value: totalStats.rejected,
      icon: Users,
      color: 'bg-destructive',
      description: 'Ditolak'
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Pengajuan Cuti Bulanan</CardTitle>
            <CardDescription>Data pengajuan cuti per bulan tahun {new Date().getFullYear()}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="submitted" fill="#8884d8" name="Diajukan" />
                <Bar dataKey="approved" fill="#82ca9d" name="Disetujui" />
                <Bar dataKey="rejected" fill="#ff8042" name="Ditolak" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Unit Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Pengajuan per Unit</CardTitle>
            <CardDescription>Top 5 unit dengan pengajuan terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={unitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {unitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
