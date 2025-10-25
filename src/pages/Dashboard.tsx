import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LeaveBalanceCards } from "@/components/LeaveBalanceCards";
import { LeaveHistory } from "@/components/LeaveHistory";
import { LeaveStatistics } from "@/components/LeaveStatistics";
import {
  User,
  Plus,
  Shield,
  ClipboardCheck
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, isAdminPusat, isAdminUnit } = useAuth();
  const [unitName, setUnitName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUnitAdmin, setIsUnitAdmin] = useState(false);

  useEffect(() => {
    if (profile?.unit_id) {
      fetchUnitName();
    }
    checkAdminStatus();
  }, [profile]);

  const checkAdminStatus = async () => {
    const adminPusatStatus = await isAdminPusat();
    const adminUnitStatus = await isAdminUnit();
    setIsAdmin(adminPusatStatus);
    setIsUnitAdmin(adminUnitStatus);
  };

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-2">
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
              {(isAdmin || isUnitAdmin) && (
                <Button 
                  variant="outline"
                  onClick={() => navigate("/approvals")}
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Persetujuan Cuti
                </Button>
              )}
              {isAdmin && (
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

      {/* Leave Statistics */}
      <div>
        <h2 className="text-xl font-bold mb-4">Statistik Pengajuan Cuti</h2>
        <LeaveStatistics />
      </div>

      {/* Leave Balances */}
      <div>
        <h2 className="text-xl font-bold mb-4">Saldo Cuti</h2>
        <LeaveBalanceCards />
      </div>

      {/* Leave History */}
      <LeaveHistory />
    </div>
  );
};

export default Dashboard;