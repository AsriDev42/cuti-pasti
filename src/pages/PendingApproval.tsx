import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { LogOut, CheckCircle, XCircle, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface LeaveApplicationWithUser {
  id: string;
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  created_at: string;
  profile: {
    full_name: string;
    nip: string;
    position: string;
    unit_id: string;
  };
  leave_type: {
    name: string;
  };
  approvals: Array<{
    id: string;
    approver_level: number;
    status: string;
    comments: string | null;
  }>;
}

const PendingApproval = () => {
  const { profile, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LeaveApplicationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [isAdminUnit, setIsAdminUnit] = useState(false);
  const [isAdminPusat, setIsAdminPusat] = useState(false);

  useEffect(() => {
    checkRoles();
  }, []);

  useEffect(() => {
    if (isAdminUnit || isAdminPusat) {
      fetchPendingApplications();
    }
  }, [isAdminUnit, isAdminPusat]);

  const checkRoles = async () => {
    const adminUnit = await hasRole('admin_unit');
    const adminPusat = await hasRole('admin_pusat');
    setIsAdminUnit(adminUnit);
    setIsAdminPusat(adminPusat);
  };

  const fetchPendingApplications = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('leave_applications' as any)
      .select(`
        *,
        profile:profiles!leave_applications_user_id_fkey(full_name, nip, position, unit_id),
        leave_type:leave_types(name),
        approvals:leave_approvals(id, approver_level, status, comments)
      `)
      .eq('approvals.approver_id', profile.id)
      .eq('approvals.status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengajuan cuti",
        variant: "destructive"
      });
    } else {
      setApplications(data as any);
    }
    setLoading(false);
  };

  const handleApproval = async (applicationId: string, approvalId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('leave_approvals' as any)
      .update({
        status: newStatus as any,
        comments: comments[approvalId] || null,
        approved_at: new Date().toISOString()
      })
      .eq('id', approvalId);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memproses persetujuan",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Berhasil",
        description: `Pengajuan cuti ${newStatus === 'approved' ? 'disetujui' : 'ditolak'}`,
      });
      fetchPendingApplications();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      approved: "default",
      rejected: "destructive"
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  if (profile?.status === 'pending_approval') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Menunggu Persetujuan</CardTitle>
            <CardDescription>
              Akun Anda sedang dalam proses verifikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Status:</strong> {profile?.status}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Silakan tunggu hingga admin memverifikasi akun Anda.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-gradient-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Persetujuan Cuti</h1>
              <p className="text-white/80 text-sm">Kelola pengajuan cuti yang memerlukan persetujuan</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-sm text-white/80">{isAdminPusat ? 'Admin Pusat' : 'Admin Unit'}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => signOut().then(() => navigate("/"))}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-semibold mb-2">Tidak Ada Pengajuan</p>
              <p className="text-muted-foreground">Belum ada pengajuan cuti yang memerlukan persetujuan Anda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => {
              const myApproval = app.approvals.find(a => a.status === 'pending');
              return (
                <Card key={app.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {app.profile.full_name}
                        </CardTitle>
                        <CardDescription>
                          {app.profile.nip} • {app.profile.position}
                        </CardDescription>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Jenis Cuti</p>
                        <p className="text-foreground">{app.leave_type.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Durasi</p>
                        <p className="text-foreground">{app.total_days} hari kerja</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Tanggal Mulai</p>
                        <p className="text-foreground">{format(new Date(app.start_date), 'dd MMMM yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Tanggal Selesai</p>
                        <p className="text-foreground">{format(new Date(app.end_date), 'dd MMMM yyyy')}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Alasan</p>
                      <p className="text-foreground bg-muted/50 p-3 rounded-lg">{app.reason}</p>
                    </div>

                    {myApproval && (
                      <div className="border-t pt-4 space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-muted-foreground">Komentar (opsional)</label>
                          <Textarea
                            placeholder="Tambahkan komentar..."
                            value={comments[myApproval.id] || ''}
                            onChange={(e) => setComments({ ...comments, [myApproval.id]: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApproval(app.id, myApproval.id, 'approved')}
                            className="flex-1 bg-success hover:bg-success/90"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Setujui
                          </Button>
                          <Button
                            onClick={() => handleApproval(app.id, myApproval.id, 'rejected')}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Tolak
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApproval;
