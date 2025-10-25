import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { XCircle, Loader2 } from 'lucide-react';

interface CancelLeaveButtonProps {
  applicationId: string;
  status: string;
  onSuccess: () => void;
}

export const CancelLeaveButton = ({ applicationId, status, onSuccess }: CancelLeaveButtonProps) => {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);

  // Only allow cancellation for submitted applications
  if (status !== 'submitted') {
    return null;
  }

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('leave_applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengajuan cuti berhasil dibatalkan",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error cancelling application:', error);
      toast({
        title: "Error",
        description: "Gagal membatalkan pengajuan cuti",
        variant: "destructive"
      });
    }
    setCancelling(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={cancelling}>
          {cancelling ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Membatalkan...
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Batalkan
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan Pengajuan Cuti?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin membatalkan pengajuan cuti ini? 
            Tindakan ini tidak dapat dibatalkan dan Anda perlu mengajukan cuti baru jika masih memerlukan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Tidak</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">
            Ya, Batalkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
