import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Akses Ditolak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Anda tidak memiliki akses untuk halaman ini.
            </p>
            <p className="text-muted-foreground">
              Silakan hubungi Admin Pusat jika Anda memerlukan akses khusus.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-gradient-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;
