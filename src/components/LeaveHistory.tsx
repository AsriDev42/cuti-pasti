import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Calendar, Clock, FileText } from 'lucide-react';
import { DocumentViewer } from './DocumentViewer';

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
  const [documentDialog, setDocumentDialog] = useState<{
    open: boolean;
    leaveId: string;
    type: 'application_letter' | 'decision_letter';
  }>({ open: false, leaveId: '', type: 'application_letter' });

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
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      approved: "default",
      rejected: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">Loading...</CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengajuan Cuti</CardTitle>
          <CardDescription>Pengajuan cuti terbaru Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada pengajuan cuti</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengajuan Cuti</CardTitle>
          <CardDescription>Pengajuan cuti terbaru Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="border-2">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{app.leave_type.name}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(app.start_date), 'dd MMM yyyy')} - {format(new Date(app.end_date), 'dd MMM yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{app.total_days} hari</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">{app.reason}</p>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Diajukan: {format(new Date(app.created_at), 'dd MMM yyyy')}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDocumentDialog({
                            open: true,
                            leaveId: app.id,
                            type: 'application_letter'
                          })}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Surat Pengajuan
                        </Button>
                        {app.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDocumentDialog({
                              open: true,
                              leaveId: app.id,
                              type: 'decision_letter'
                            })}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            SK Cuti
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <DocumentViewer
        leaveApplicationId={documentDialog.leaveId}
        documentType={documentDialog.type}
        open={documentDialog.open}
        onOpenChange={(open) => setDocumentDialog({ ...documentDialog, open })}
      />
    </>
  );
};
