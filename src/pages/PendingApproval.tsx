import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Clock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PendingApproval = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Menunggu Persetujuan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Pendaftaran Anda telah berhasil dan sedang menunggu persetujuan dari Admin Pusat (Setditjen Binalavotas).
            </p>
            <p className="text-muted-foreground">
              Anda akan menerima email notifikasi setelah akun Anda disetujui.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
