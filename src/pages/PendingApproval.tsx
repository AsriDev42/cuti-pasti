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
  leave_address: string;
  contact_phone: string;
  document_links: string[];
  status: string;
  created_at: string;
  unit_admin_notes: string | null;
  pusat_admin_notes: string | null;
  profile: {
    full_name: string;
    nip: string;
    position: string;
    unit_id: string;
  };
  leave_type: {
    name: string;
  };
}

const PendingApproval = () => {
  const { profile, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LeaveApplicationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
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

    try {
      let query = supabase
        .from('leave_applications')
        .select('*');

      // Admin Unit melihat pengajuan yang baru submitted dari unit mereka
      if (isAdminUnit && !isAdminPusat) {
        query = query.eq('status', 'submitted');
      }
      // Admin Pusat melihat pengajuan yang sudah disetujui Admin Unit atau baru submitted
      else if (isAdminPusat) {
        query = query.in('status', ['approved_unit', 'submitted']);
      }

      const { data: applications, error: appsError } = await query.order('created_at', { ascending: false });

      if (appsError) throw appsError;

      if (!applications || applications.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // Fetch profiles untuk setiap application
      const userIds = [...new Set(applications.map(app => app.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, nip, position, unit_id')
        .in('id', userIds);

      // Fetch leave types
      const leaveTypeIds = [...new Set(applications.map(app => app.leave_type_id))];
      const { data: leaveTypes } = await supabase
        .from('leave_types')
        .select('id, name')
        .in('id', leaveTypeIds);

      // Combine data
      const enrichedApplications = applications.map(app => {
        const profile = profiles?.find(p => p.id === app.user_id);
        const leaveType = leaveTypes?.find(lt => lt.id === app.leave_type_id);
        
        return {
          ...app,
          profile: profile || { full_name: '', nip: '', position: '', unit_id: '' },
          leave_type: leaveType || { name: '' }
        };
      });

      // Filter by unit for Admin Unit
      const filteredApplications = isAdminUnit && !isAdminPusat
        ? enrichedApplications.filter(app => app.profile.unit_id === profile.unit_id)
        : enrichedApplications;

      setApplications(filteredApplications as LeaveApplicationWithUser[]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengajuan cuti",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleApproval = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      let newStatus: string;
      let noteField: string;
      
      // Tentukan status baru berdasarkan role dan action
      if (isAdminUnit && !isAdminPusat) {
        newStatus = action === 'approve' ? 'approved_unit' : 'rejected_unit';
        noteField = 'unit_admin_notes';
      } else if (isAdminPusat) {
        newStatus = action === 'approve' ? 'approved_pusat' : 'rejected_pusat';
        noteField = 'pusat_admin_notes';
      } else {
        return;
      }

      const updateData: any = {
        status: newStatus,
        [`reviewed_by_${isAdminPusat ? 'pusat' : 'unit'}`]: profile?.id,
        [`reviewed_at_${isAdminPusat ? 'pusat' : 'unit'}`]: new Date().toISOString()
      };

      if (notes[applicationId]) {
        updateData[noteField] = notes[applicationId];
      }

      const { error } = await supabase
        .from('leave_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) {
        throw error;
      }

      toast({
        title: "Berhasil",
        description: `Pengajuan cuti ${action === 'approve' ? 'disetujui' : 'ditolak'}`,
      });
      
      fetchPendingApplications();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Gagal memproses persetujuan",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", label: string } } = {
      submitted: { variant: "outline", label: "Menunggu" },
      approved_unit: { variant: "secondary", label: "Disetujui Unit" },
      approved_pusat: { variant: "default", label: "Disetujui" },
      rejected_unit: { variant: "destructive", label: "Ditolak Unit" },
      rejected_pusat: { variant: "destructive", label: "Ditolak Pusat" }
    };
    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!isAdminUnit && !isAdminPusat) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Akses Ditolak</CardTitle>
            <CardDescription>
              Halaman ini hanya untuk admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Anda tidak memiliki akses untuk melihat halaman persetujuan cuti.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              const canApprove = 
                (isAdminUnit && !isAdminPusat && app.status === 'submitted') ||
                (isAdminPusat && app.status === 'approved_unit');
              
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Alamat Selama Cuti</p>
                        <p className="text-foreground">{app.leave_address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">No. Telepon</p>
                        <p className="text-foreground">{app.contact_phone}</p>
                      </div>
                    </div>

                    {app.document_links && app.document_links.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Dokumen Pendukung</p>
                        <div className="space-y-1">
                          {app.document_links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline block"
                            >
                              Dokumen {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {(app.unit_admin_notes || app.pusat_admin_notes) && (
                      <div className="border-t pt-4">
                        {app.unit_admin_notes && (
                          <div className="mb-2">
                            <p className="text-sm font-semibold text-muted-foreground">Catatan Admin Unit</p>
                            <p className="text-sm text-foreground">{app.unit_admin_notes}</p>
                          </div>
                        )}
                        {app.pusat_admin_notes && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Catatan Admin Pusat</p>
                            <p className="text-sm text-foreground">{app.pusat_admin_notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {canApprove && (
                      <div className="border-t pt-4 space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-muted-foreground">
                            Catatan {isAdminPusat ? 'Admin Pusat' : 'Admin Unit'} (opsional)
                          </label>
                          <Textarea
                            placeholder="Tambahkan catatan..."
                            value={notes[app.id] || ''}
                            onChange={(e) => setNotes({ ...notes, [app.id]: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApproval(app.id, 'approve')}
                            className="flex-1 bg-success hover:bg-success/90"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Setujui
                          </Button>
                          <Button
                            onClick={() => handleApproval(app.id, 'reject')}
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
  );
};

export default PendingApproval;
