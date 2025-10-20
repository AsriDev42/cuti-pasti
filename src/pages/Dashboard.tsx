import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  LogOut,
  User,
  Plus
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  // Simulated user data - will be replaced with real data
  const user = {
    name: "John Doe",
    nip: "198912345678901234",
    unit: "Sekretariat Ditjen Binalavotas",
    role: "User"
  };

  const stats = [
    {
      title: "Saldo Cuti Tahunan",
      value: "10",
      subtitle: "dari 12 hari",
      icon: Calendar,
      color: "text-success"
    },
    {
      title: "Pengajuan Pending",
      value: "2",
      subtitle: "menunggu persetujuan",
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "Cuti Disetujui",
      value: "3",
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

  const recentLeaves = [
    {
      type: "Cuti Tahunan",
      startDate: "20 Nov 2025",
      endDate: "22 Nov 2025",
      days: 2,
      status: "Disetujui Pusat",
      statusColor: "bg-success"
    },
    {
      type: "Cuti Sakit",
      startDate: "15 Okt 2025",
      endDate: "16 Okt 2025",
      days: 2,
      status: "Diajukan",
      statusColor: "bg-info"
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
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-white/80">{user.nip}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => navigate("/")}
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
                  Selamat Datang, {user.name}
                </h2>
                <p className="text-muted-foreground mb-1">{user.unit}</p>
                <p className="text-sm text-muted-foreground">Role: {user.role}</p>
              </div>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Ajukan Cuti Baru
              </Button>
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

        {/* Recent Leaves */}
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
              <Button variant="outline">Lihat Semua</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeaves.map((leave, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{leave.type}</h3>
                    <p className="text-sm text-muted-foreground">
                      {leave.startDate} - {leave.endDate} ({leave.days} hari)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${leave.statusColor}`}>
                      {leave.status}
                    </span>
                    <Button variant="ghost" size="sm">Detail</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
