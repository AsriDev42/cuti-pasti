import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Unit {
  id: string;
  name: string;
  code: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState({
    nip: "",
    full_name: "",
    email: "",
    phone: "",
    unit_id: "",
    position: "",
    rank: "",
    join_date: "",
    address: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
    fetchUnits();
  }, [user, navigate]);

  const fetchUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching units:', error);
    } else {
      setUnits(data || []);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Password dan konfirmasi password tidak cocok",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password minimal 8 karakter",
        variant: "destructive"
      });
      return;
    }

    if (!formData.unit_id) {
      toast({
        title: "Error",
        description: "Silakan pilih unit kerja",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp({
      nip: formData.nip,
      full_name: formData.full_name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      unit_id: formData.unit_id,
      position: formData.position,
      rank: formData.rank,
      join_date: formData.join_date || undefined,
      address: formData.address || undefined,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Pendaftaran Gagal",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Pendaftaran Berhasil",
        description: "Akun Anda menunggu persetujuan dari Admin Pusat. Anda akan menerima email konfirmasi.",
      });
      navigate("/pending-approval");
    }
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
                  value={formData.nip}
                  onChange={(e) => handleChange('nip', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap *</Label>
                <Input
                  id="full_name"
                  placeholder="Nama lengkap Anda"
                  required
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">No. Telepon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08123456789"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="unit">Unit Kerja *</Label>
                <Select 
                  required 
                  value={formData.unit_id}
                  onValueChange={(value) => handleChange('unit_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit kerja" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
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
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank">Pangkat/Golongan *</Label>
                <Input
                  id="rank"
                  placeholder="Contoh: Penata/III-c"
                  required
                  value={formData.rank}
                  onChange={(e) => handleChange('rank', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="join_date">Tanggal Bergabung</Label>
                <Input
                  id="join_date"
                  type="date"
                  value={formData.join_date}
                  onChange={(e) => handleChange('join_date', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  placeholder="Alamat lengkap"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={3}
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
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
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
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
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
                type="button"
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
