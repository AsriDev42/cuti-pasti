import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Users, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserWithoutBalance {
  id: string;
  full_name: string;
  nip: string;
  unit: { name: string } | null;
}

export const LeaveBalanceInitializer = () => {
  const { toast } = useToast();
  const [usersWithoutBalance, setUsersWithoutBalance] = useState<UserWithoutBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    checkUsersWithoutBalance();
  }, []);

  const checkUsersWithoutBalance = async () => {
    setLoading(true);
    const currentYear = new Date().getFullYear();

    // Get all active users
    const { data: users } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        nip,
        unit:units!unit_id(name)
      `)
      .eq('status', 'active');

    if (users) {
      // Check which users don't have balance for current year
      const usersWithoutBalances = [];
      for (const user of users) {
        const { data: balance } = await supabase
          .from('leave_balances')
          .select('id')
          .eq('user_id', user.id)
          .eq('year', currentYear)
          .limit(1);

        if (!balance || balance.length === 0) {
          usersWithoutBalances.push(user as UserWithoutBalance);
        }
      }
      setUsersWithoutBalance(usersWithoutBalances);
    }
    setLoading(false);
  };

  const initializeBalancesForAll = async () => {
    setInitializing(true);
    const currentYear = new Date().getFullYear();

    // Get all leave types
    const { data: leaveTypes } = await supabase
      .from('leave_types')
      .select('id, default_quota');

    if (leaveTypes) {
      let successCount = 0;
      let errorCount = 0;

      for (const user of usersWithoutBalance) {
        // Create balance for each leave type
        const balances = leaveTypes.map(lt => ({
          user_id: user.id,
          leave_type_id: lt.id,
          year: currentYear,
          total_quota: lt.default_quota,
          used: 0,
          remaining: lt.default_quota
        }));

        const { error } = await supabase
          .from('leave_balances')
          .insert(balances);

        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      }

      toast({
        title: "Inisialisasi Selesai",
        description: `Berhasil: ${successCount} user, Gagal: ${errorCount} user`,
        variant: successCount > 0 ? "default" : "destructive"
      });

      checkUsersWithoutBalance();
    }
    setInitializing(false);
  };

  const initializeBalanceForUser = async (userId: string, userName: string) => {
    const currentYear = new Date().getFullYear();

    // Get all leave types
    const { data: leaveTypes } = await supabase
      .from('leave_types')
      .select('id, default_quota');

    if (leaveTypes) {
      const balances = leaveTypes.map(lt => ({
        user_id: userId,
        leave_type_id: lt.id,
        year: currentYear,
        total_quota: lt.default_quota,
        used: 0,
        remaining: lt.default_quota
      }));

      const { error } = await supabase
        .from('leave_balances')
        .insert(balances);

      if (error) {
        toast({
          title: "Error",
          description: `Gagal inisialisasi saldo untuk ${userName}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Berhasil",
          description: `Saldo cuti ${userName} berhasil diinisialisasi`,
        });
        checkUsersWithoutBalance();
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Checking balances...</p>
        </CardContent>
      </Card>
    );
  }

  if (usersWithoutBalance.length === 0) {
    return (
      <Card className="border-success">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Semua User Sudah Terinisialisasi</h3>
              <p className="text-sm text-muted-foreground">
                Semua user aktif sudah memiliki saldo cuti untuk tahun {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warning">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Inisialisasi Saldo Cuti
            </CardTitle>
            <CardDescription>
              {usersWithoutBalance.length} user belum memiliki saldo cuti untuk tahun {new Date().getFullYear()}
            </CardDescription>
          </div>
          <Button 
            onClick={initializeBalancesForAll}
            disabled={initializing}
            className="bg-gradient-primary"
          >
            {initializing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Menginisialisasi...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Inisialisasi Semua
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NIP</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersWithoutBalance.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-sm">{user.nip}</TableCell>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.unit?.name || "-"}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => initializeBalanceForUser(user.id, user.full_name)}
                  >
                    Inisialisasi
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
