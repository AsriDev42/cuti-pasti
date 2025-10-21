import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
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
      icon: Calendar,
      color: "text-success"
    },
    {
      title: "Pengajuan Pending",
      value: "0",
      subtitle: "menunggu persetujuan",
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "Cuti Disetujui",
      value: "0",
      subtitle: "tahun ini",
      icon: CheckCircle,
      color: "text-success"
    },
    {
      title: "Cuti Ditolak",
      value: "0",
      subtitle: "tahun ini",
      icon: XCircle,
      color: "text-destructive"
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
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajukan Cuti
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Leaves - Empty State */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Riwayat Pengajuan Cuti
                </CardTitle>
                <CardDescription>Pengajuan cuti terbaru Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada pengajuan cuti</p>
              <p className="text-sm">Mulai ajukan cuti untuk melihat riwayat di sini</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
