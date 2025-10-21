import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useWorkingDays } from "@/hooks/useWorkingDays";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LeaveType {
  id: string;
  name: string;
  code: string;
  description: string;
  max_days_per_request: number;
  min_notice_days: number;
  requires_document: boolean;
}

interface LeaveBalance {
  remaining: number;
}

const LeaveApplication = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  
  const [formData, setFormData] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
    leave_address: "",
    contact_phone: "",
    document_links: [""]
  });

  const { workingDays } = useWorkingDays(formData.start_date, formData.end_date);

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    if (formData.leave_type_id && user) {
      const leaveType = leaveTypes.find(lt => lt.id === formData.leave_type_id);
      setSelectedLeaveType(leaveType || null);
      fetchBalance(formData.leave_type_id);
    }
  }, [formData.leave_type_id, leaveTypes, user]);

  const fetchLeaveTypes = async () => {
    const { data } = await supabase
      .from('leave_types' as any)
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    setLeaveTypes((data as any) || []);
  };

  const fetchBalance = async (leaveTypeId: string) => {
    const currentYear = new Date().getFullYear();
    const { data } = await supabase
      .from('leave_balances' as any)
      .select('remaining')
      .eq('user_id', user?.id)
      .eq('leave_type_id', leaveTypeId)
      .eq('year', currentYear)
      .maybeSingle();
    
    setBalance(data as any);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentLinkChange = (index: number, value: string) => {
    const newLinks = [...formData.document_links];
    newLinks[index] = value;
    setFormData(prev => ({ ...prev, document_links: newLinks }));
  };

  const addDocumentLink = () => {
    setFormData(prev => ({
      ...prev,
      document_links: [...prev.document_links, ""]
    }));
  };

  const removeDocumentLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      document_links: prev.document_links.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.leave_type_id) {
      toast({
        title: "Error",
        description: "Pilih jenis cuti",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Tanggal mulai dan selesai harus diisi",
        variant: "destructive"
      });
      return false;
    }

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      toast({
        title: "Error",
        description: "Tanggal mulai tidak boleh di masa lalu",
        variant: "destructive"
      });
      return false;
    }

    if (start > end) {
      toast({
        title: "Error",
        description: "Tanggal selesai harus setelah tanggal mulai",
        variant: "destructive"
      });
      return false;
    }

    if (selectedLeaveType?.min_notice_days) {
      const minNoticeDate = new Date(today);
      minNoticeDate.setDate(minNoticeDate.getDate() + selectedLeaveType.min_notice_days);
      
      if (start < minNoticeDate) {
        toast({
          title: "Error",
          description: `Cuti harus diajukan minimal ${selectedLeaveType.min_notice_days} hari sebelumnya`,
          variant: "destructive"
        });
        return false;
      }
    }

    if (selectedLeaveType?.max_days_per_request && workingDays > selectedLeaveType.max_days_per_request) {
      toast({
        title: "Error",
        description: `Maksimal ${selectedLeaveType.max_days_per_request} hari per pengajuan`,
        variant: "destructive"
      });
      return false;
    }

    if (balance && workingDays > balance.remaining) {
      toast({
        title: "Error",
        description: `Saldo cuti tidak mencukupi. Sisa: ${balance.remaining} hari`,
        variant: "destructive"
      });
      return false;
    }

    if (!formData.reason.trim()) {
      toast({
        title: "Error",
        description: "Alasan cuti harus diisi",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.leave_address.trim()) {
      toast({
        title: "Error",
        description: "Alamat selama cuti harus diisi",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.contact_phone.trim()) {
      toast({
        title: "Error",
        description: "Nomor telepon harus diisi",
        variant: "destructive"
      });
      return false;
    }

    const validLinks = formData.document_links.filter(link => link.trim());
    if (selectedLeaveType?.requires_document && validLinks.length === 0) {
      toast({
        title: "Error",
        description: "Dokumen pendukung wajib dilampirkan",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    const validLinks = formData.document_links.filter(link => link.trim());
    
    const { error } = await supabase
      .from('leave_applications' as any)
      .insert([{
        user_id: user?.id,
        leave_type_id: formData.leave_type_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_days: workingDays,
        reason: formData.reason,
        leave_address: formData.leave_address,
        contact_phone: formData.contact_phone,
        document_links: validLinks,
        status: 'submitted'
      }]);

    setLoading(false);

    if (error) {
      toast({
        title: "Pengajuan Gagal",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Pengajuan Berhasil",
        description: "Pengajuan cuti Anda telah disubmit dan menunggu persetujuan Admin Unit",
      });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-gradient-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Pengajuan Cuti Baru
              </h1>
              <p className="text-white/80 text-sm">Isi formulir pengajuan cuti</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Formulir Pengajuan Cuti</CardTitle>
            <CardDescription>
              Lengkapi semua informasi yang diperlukan untuk pengajuan cuti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Leave Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="leave_type">Jenis Cuti *</Label>
                <Select
                  value={formData.leave_type_id}
                  onValueChange={(value) => handleChange('leave_type_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis cuti" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLeaveType && (
                  <p className="text-sm text-muted-foreground">
                    {selectedLeaveType.description}
                  </p>
                )}
              </div>

              {/* Balance Info */}
              {balance && (
                <Alert>
                  <CalendarIcon className="h-4 w-4" />
                  <AlertDescription>
                    Saldo cuti tersedia: <strong>{balance.remaining} hari</strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Tanggal Mulai *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Tanggal Selesai *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Working Days Display */}
              {workingDays > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Total hari kerja: <strong>{workingDays} hari</strong>
                    <br />
                    <span className="text-xs">
                      (Tidak termasuk weekend dan hari libur nasional)
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Alasan Cuti *</Label>
                <Textarea
                  id="reason"
                  placeholder="Jelaskan alasan pengajuan cuti"
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="leave_address">Alamat Selama Cuti *</Label>
                  <Textarea
                    id="leave_address"
                    placeholder="Alamat lengkap yang dapat dihubungi"
                    value={formData.leave_address}
                    onChange={(e) => handleChange('leave_address', e.target.value)}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">No. Telepon *</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    placeholder="08123456789"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Document Links */}
              <div className="space-y-2">
                <Label>
                  Link Dokumen Pendukung (Google Drive)
                  {selectedLeaveType?.requires_document && " *"}
                </Label>
                {formData.document_links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="https://drive.google.com/..."
                      value={link}
                      onChange={(e) => handleDocumentLinkChange(index, e.target.value)}
                    />
                    {formData.document_links.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeDocumentLink(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDocumentLink}
                >
                  + Tambah Link
                </Button>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/dashboard")}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                  disabled={loading || workingDays === 0}
                >
                  {loading ? "Mengirim..." : "Ajukan Cuti"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaveApplication;
