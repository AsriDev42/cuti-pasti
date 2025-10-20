import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Calendar, CheckCircle, Clock, FileText, Shield, Users } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Pengajuan Cuti Digital",
      description: "Ajukan berbagai jenis cuti dengan mudah dan cepat secara online"
    },
    {
      icon: Clock,
      title: "Perhitungan Otomatis",
      description: "Sistem menghitung hari kerja otomatis dengan mempertimbangkan hari libur"
    },
    {
      icon: CheckCircle,
      title: "Approval Bertingkat",
      description: "Workflow persetujuan yang jelas dari Admin Unit hingga Admin Pusat"
    },
    {
      icon: FileText,
      title: "Template Surat",
      description: "Template surat pengantar dan SK Cuti yang dapat disesuaikan"
    },
    {
      icon: Users,
      title: "Manajemen User",
      description: "Kelola user, role, dan unit kerja dengan mudah"
    },
    {
      icon: Shield,
      title: "Aman & Terpercaya",
      description: "Data tersimpan aman dengan akses berbasis role"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNC40MTggMy41ODItOCA4LThzOCAzLjU4MiA4IDgtMy41ODIgOC04IDgtOC0zLjU4Mi04LTh6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-block mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
              Sistem Informasi Cuti ASN
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              SI CUTI
            </h1>
            
            <p className="text-xl md:text-2xl mb-4 text-white/90 font-medium">
              Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas
            </p>
            
            <p className="text-lg md:text-xl mb-10 text-white/80 max-w-2xl mx-auto">
              Kelola pengajuan dan persetujuan cuti ASN dengan mudah, cepat, dan transparan
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/register")}
                className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 h-auto"
              >
                Daftar Sekarang
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/login")}
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 h-auto"
              >
                Login
              </Button>
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Sistem yang lengkap untuk memudahkan pengelolaan cuti ASN
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-2 hover:border-primary/50 transition-all hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Siap Memulai?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Daftarkan diri Anda dan mulai kelola cuti dengan lebih efisien
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/register")}
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-6 h-auto"
            >
              Daftar Sekarang
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/80">
            © 2025 Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas
          </p>
          <p className="text-white/60 text-sm mt-2">
            Kementerian Ketenagakerjaan Republik Indonesia
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
