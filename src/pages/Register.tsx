import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const units = [
    "Sekretariat Ditjen Binalavotas",
    "Direktorat Standardisasi Kompetensi dan Pelatihan Kerja",
    "Direktorat Bina Pelatihan Vokasi",
    "Direktorat Bina Produktivitas",
    "Direktorat Pembinaan Kelembagaan Pelatihan Vokasi"
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Simulate registration - will be implemented with Lovable Cloud later
    setTimeout(() => {
      toast({
        title: "Pendaftaran Berhasil",
        description: "Akun Anda akan diaktivasi oleh Admin Pusat. Anda akan menerima email konfirmasi.",
      });
      setLoading(false);
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Pendaftaran SI CUTI</CardTitle>
          <CardDescription>
            Daftarkan diri Anda sebagai ASN Ditjen Binalavotas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP *</Label>
                <Input
                  id="nip"
                  placeholder="198912345678901234"
                  required
                  maxLength={18}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullname">Nama Lengkap *</Label>
                <Input
                  id="fullname"
                  placeholder="Nama lengkap Anda"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">No. Telepon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08123456789"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit Kerja *</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit kerja" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Jabatan *</Label>
                <Input
                  id="position"
                  placeholder="Contoh: Analis Kepegawaian"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank">Pangkat/Golongan *</Label>
                <Input
                  id="rank"
                  placeholder="Contoh: Penata/III-c"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="joinDate">Tanggal Bergabung</Label>
                <Input
                  id="joinDate"
                  type="date"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  placeholder="Alamat lengkap"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={loading}
              >
                {loading ? "Mendaftar..." : "Daftar"}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Sudah punya akun?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => navigate("/login")}
              >
                Login di sini
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
