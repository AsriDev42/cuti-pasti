import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useDocumentGenerator } from '@/hooks/useDocumentGenerator';
import { toast } from '@/hooks/use-toast';

interface DocumentViewerProps {
  leaveApplicationId: string;
  documentType: 'application_letter' | 'decision_letter';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocumentViewer = ({
  leaveApplicationId,
  documentType,
  open,
  onOpenChange,
}: DocumentViewerProps) => {
  const { generateDocument, generating } = useDocumentGenerator();
  const [documentContent, setDocumentContent] = useState<string>('');

  const handleGenerate = async () => {
    try {
      const { content } = await generateDocument({ leaveApplicationId, documentType });
      setDocumentContent(content);
      toast({
        title: 'Berhasil',
        description: 'Dokumen berhasil dibuat',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat dokumen',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${documentType === 'application_letter' ? 'Surat Pengajuan Cuti' : 'Surat Keputusan Cuti'}</title>
            <style>
              body {
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                line-height: 1.6;
                margin: 2cm;
                white-space: pre-wrap;
              }
              @media print {
                body { margin: 1cm; }
              }
            </style>
          </head>
          <body>${documentContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {documentType === 'application_letter' ? 'Surat Pengajuan Cuti' : 'Surat Keputusan Cuti'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!documentContent ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Klik tombol di bawah untuk membuat dokumen</p>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Membuat Dokumen...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Buat Dokumen
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="border rounded-lg p-6 bg-white text-foreground overflow-y-auto max-h-[60vh]">
                <pre className="whitespace-pre-wrap font-serif text-sm">{documentContent}</pre>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDocumentContent('')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Buat Ulang
                </Button>
                <Button onClick={handlePrint}>
                  <Download className="w-4 h-4 mr-2" />
                  Cetak / Download
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
