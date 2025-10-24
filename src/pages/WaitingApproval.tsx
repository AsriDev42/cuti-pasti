import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Clock, LogOut } from "lucide-react";

const WaitingApproval = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <CardTitle className="text-2xl">Menunggu Persetujuan</CardTitle>
            <CardDescription>
              Akun Anda sedang dalam proses verifikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg space-y-2">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Nama</p>
                <p className="text-foreground">{profile?.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">NIP</p>
                <p className="text-foreground">{profile?.nip}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Status</p>
                <p className="text-foreground capitalize">{profile?.status?.replace('_', ' ')}</p>
              </div>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Silakan tunggu hingga admin unit memverifikasi akun Anda. 
                Anda akan mendapat notifikasi melalui email setelah akun disetujui.
              </p>
            </div>

            <Button
              onClick={() => signOut().then(() => navigate("/"))}
              variant="outline"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaitingApproval;
