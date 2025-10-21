import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LeaveBalanceCards } from "@/components/LeaveBalanceCards";
import { LeaveHistory } from "@/components/LeaveHistory";
import {
  LogOut,
  User,
  Plus,
  Shield
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, profile, isAdminPusat } = useAuth();
  const [unitName, setUnitName] = useState("");

  useEffect(() => {
    if (profile?.unit_id) {
      fetchUnitName();
    }
  }, [profile]);

  const fetchUnitName = async () => {
    if (!profile?.unit_id) return;
    
    const { data } = await supabase
      .from('units')
      .select('name')
      .eq('id', profile.unit_id)
      .single();
    
    if (data) {
      setUnitName(data.name);
    }
  };

  const stats = [
    {
      title: "Saldo Cuti Tahunan",
      value: "12",
      subtitle: "dari 12 hari",
      icon: User,
      color: "text-success"
    }
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-gradient-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">SI CUTI</h1>
              <p className="text-white/80 text-sm">Sistem Informasi Cuti ASN</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-sm text-white/80">{profile?.nip}</p>
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
        {/* Welcome Section */}
        <Card className="mb-8 border-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Selamat Datang, {profile?.full_name}
                </h2>
                <p className="text-muted-foreground mb-1">{unitName || "Loading unit..."}</p>
                <p className="text-sm text-muted-foreground">{profile?.position} - {profile?.rank}</p>
              </div>
              <div className="flex flex-col gap-2">
                {isAdminPusat() && (
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/admin-pusat")}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Pusat
                  </Button>
                )}
                <Button 
                  className="bg-gradient-primary hover:opacity-90"
                  onClick={() => navigate("/leave/new")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajukan Cuti
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Balances */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Saldo Cuti</h2>
          <LeaveBalanceCards />
        </div>

        {/* Leave History */}
        <LeaveHistory />
      </div>
    </div>
  );
};

export default Dashboard;
