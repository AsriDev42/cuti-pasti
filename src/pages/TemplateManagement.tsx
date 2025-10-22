import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { LogOut, FileText, Save, Plus } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  type: string;
  template_content: string;
  is_active: boolean;
}

const TemplateManagement = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('document_templates' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTemplates(data as any);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    const { error } = await supabase
      .from('document_templates' as any)
      .update({
        name: editingTemplate.name,
        template_content: editingTemplate.template_content,
        is_active: editingTemplate.is_active,
      })
      .eq('id', editingTemplate.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan template',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Template berhasil disimpan',
      });
      setEditingTemplate(null);
      fetchTemplates();
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-gradient-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Kelola Template Dokumen</h1>
              <p className="text-white/80 text-sm">Atur template surat pengajuan dan keputusan cuti</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-sm text-white/80">Admin Pusat</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => signOut().then(() => navigate('/'))}
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
        ) : editingTemplate ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Template: {editingTemplate.name}</CardTitle>
              <CardDescription>
                Gunakan variabel dalam format {'{{variable_name}}'} untuk data dinamis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Template</Label>
                <Input
                  id="name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="content">Konten Template</Label>
                <Textarea
                  id="content"
                  value={editingTemplate.template_content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, template_content: e.target.value })}
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Variabel yang tersedia:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <code>{'{{full_name}}'}</code>
                  <code>{'{{nip}}'}</code>
                  <code>{'{{position}}'}</code>
                  <code>{'{{rank}}'}</code>
                  <code>{'{{unit_name}}'}</code>
                  <code>{'{{leave_type}}'}</code>
                  <code>{'{{total_days}}'}</code>
                  <code>{'{{start_date}}'}</code>
                  <code>{'{{end_date}}'}</code>
                  <code>{'{{reason}}'}</code>
                  <code>{'{{city}}'}</code>
                  <code>{'{{application_date}}'}</code>
                  <code>{'{{decision_number}}'}</code>
                  <code>{'{{approver_name}}'}</code>
                  <code>{'{{approver_nip}}'}</code>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Batal
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {template.name}
                      </CardTitle>
                      <CardDescription>
                        Tipe: {template.type === 'leave_application' ? 'Surat Pengajuan' : 'Surat Keputusan'}
                      </CardDescription>
                    </div>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end">
                    <Button onClick={() => setEditingTemplate(template)}>
                      Edit Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManagement;
