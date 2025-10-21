import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface LeaveApplication {
  id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  reason: string;
  created_at: string;
  leave_type: {
    name: string;
  };
}

export const LeaveHistory = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('leave_applications' as any)
      .select(`
        *,
        leave_type:leave_types(name)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setApplications(data as any);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
      submitted: { label: 'Diajukan', className: 'bg-info text-white' },
      approved_unit: { label: 'Disetujui Unit', className: 'bg-primary text-white' },
      rejected_unit: { label: 'Ditolak Unit', className: 'bg-destructive text-white' },
      approved_pusat: { label: 'Disetujui Pusat', className: 'bg-success text-white' },
      rejected_pusat: { label: 'Ditolak Pusat', className: 'bg-destructive text-white' },
      cancelled: { label: 'Dibatalkan', className: 'bg-muted text-muted-foreground' }
    };

    const config = statusConfig[status] || { label: status, className: 'bg-muted' };
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: localeId });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Riwayat Pengajuan Cuti
          </CardTitle>
          <CardDescription>Pengajuan cuti terbaru Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada pengajuan cuti</p>
            <p className="text-sm">Mulai ajukan cuti untuk melihat riwayat di sini</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Riwayat Pengajuan Cuti
            </CardTitle>
            <CardDescription>Pengajuan cuti terbaru Anda</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {application.leave_type.name}
                  </h3>
                  {getStatusBadge(application.status)}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(application.start_date)} - {formatDate(application.end_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{application.total_days} hari</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {application.reason}
                </p>
              </div>

              <div className="ml-4">
                <Button variant="ghost" size="sm">
                  Detail
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
