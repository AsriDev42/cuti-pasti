import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LogIn } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Simulate login - will be implemented with Lovable Cloud later
    setTimeout(() => {
      toast({
        title: "Login Berhasil",
        description: "Selamat datang di SI CUTI",
      });
      setLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
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
              <LogIn className="w-5 h-5 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Login SI CUTI</CardTitle>
          <CardDescription>
            Masuk ke akun Anda untuk mengelola cuti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">NIP atau Email</Label>
              <Input
                id="identifier"
                placeholder="Masukkan NIP atau email"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-primary"
                  type="button"
                >
                  Lupa password?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Loading..." : "Login"}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Belum punya akun?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => navigate("/register")}
              >
                Daftar di sini
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
