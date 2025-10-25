import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const ExportLeaveReport = () => {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const exportToCSV = async () => {
    setExporting(true);

    try {
      let query = supabase
        .from('leave_applications')
        .select(`
          *,
          profiles!leave_applications_user_id_fkey(
            nip,
            full_name,
            unit:units(name)
          ),
          leave_types(name, code)
        `);

      // Apply filters
      if (exportType !== 'all') {
        if (exportType === 'approved') {
          query = query.eq('status', 'approved_pusat');
        } else if (exportType === 'pending') {
          query = query.in('status', ['submitted', 'approved_unit']);
        } else if (exportType === 'rejected') {
          query = query.in('status', ['rejected_unit', 'rejected_pusat']);
        }
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Tidak ada data",
          description: "Tidak ada data yang sesuai dengan filter",
          variant: "destructive"
        });
        setExporting(false);
        return;
      }

      // Convert to CSV
      const headers = [
        'NIP',
        'Nama',
        'Unit',
        'Jenis Cuti',
        'Tanggal Mulai',
        'Tanggal Selesai',
        'Total Hari',
        'Status',
        'Alasan',
        'Tanggal Pengajuan'
      ];

      const csvRows = [headers.join(',')];

      data.forEach((app: any) => {
        const row = [
          app.profiles.nip,
          `"${app.profiles.full_name}"`,
          `"${app.profiles.unit?.name || '-'}"`,
          `"${app.leave_types.name}"`,
          format(new Date(app.start_date), 'dd/MM/yyyy'),
          format(new Date(app.end_date), 'dd/MM/yyyy'),
          app.total_days,
          app.status,
          `"${app.reason.replace(/"/g, '""')}"`,
          format(new Date(app.created_at), 'dd/MM/yyyy HH:mm')
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `laporan_cuti_${exportType}_${format(new Date(), 'ddMMyyyy_HHmmss')}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Berhasil",
        description: `${data.length} data berhasil diexport ke ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat export data",
        variant: "destructive"
      });
    }

    setExporting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Export Laporan Cuti
        </CardTitle>
        <CardDescription>
          Download laporan pengajuan cuti dalam format CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Jenis Laporan</Label>
            <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pengajuan</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tanggal Mulai</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tanggal Selesai</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={exportToCSV} 
          disabled={exporting}
          className="w-full bg-gradient-primary"
        >
          {exporting ? (
            <>
              <Download className="w-4 h-4 mr-2 animate-pulse" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export ke CSV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
