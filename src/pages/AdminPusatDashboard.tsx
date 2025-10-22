import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  LogOut,
  Search,
  CheckCircle,
  XCircle,
  Shield,
  FileText
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProfileWithUnit {
  id: string;
  nip: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  rank: string;
  status: string;
  unit: {
    name: string;
  } | null;
  user_roles: Array<{ role: string }>;
}

const AdminPusatDashboard = () => {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ProfileWithUnit[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ProfileWithUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<ProfileWithUnit | null>(null);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [changeRoleDialog, setChangeRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        unit:units(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data user",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Fetch roles separately
    const usersWithRoles = await Promise.all((data || []).map(async (user) => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      return { ...user, user_roles: roles || [] };
    }));

    setUsers(usersWithRoles as ProfileWithUnit[]);
    setLoading(false);
  };

  const filterUsers = () => {
    let filtered = users;

    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.nip.includes(searchQuery) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleApprove = async () => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', selectedUser.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menyetujui user",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Berhasil",
        description: `User ${selectedUser.full_name} telah disetujui`,
      });
      fetchUsers();
    }
    setApproveDialog(false);
    setSelectedUser(null);
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectionReason) return;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        status: 'rejected',
        rejection_reason: rejectionReason
      })
      .eq('id', selectedUser.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menolak user",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Berhasil",
        description: `User ${selectedUser.full_name} telah ditolak`,
      });
      fetchUsers();
    }
    setRejectDialog(false);
    setSelectedUser(null);
    setRejectionReason("");
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    // Delete existing roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', selectedUser.id);

    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert([{ user_id: selectedUser.id, role: newRole as any }]);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah role",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Berhasil",
        description: `Role user ${selectedUser.full_name} telah diubah`,
      });
      fetchUsers();
    }
    setChangeRoleDialog(false);
    setSelectedUser(null);
    setNewRole("");
  };

  const getRoleBadge = (roles: Array<{ role: string }>) => {
    if (!roles || roles.length === 0) return null;
    const role = roles[0].role;
    const colors = {
      user: "bg-info",
      admin_unit: "bg-warning",
      admin_pusat: "bg-destructive"
    };
    const labels = {
      user: "User",
      admin_unit: "Admin Unit",
      admin_pusat: "Admin Pusat"
    };
    return (
      <Badge className={`${colors[role as keyof typeof colors]} text-white`}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending_approval: "bg-warning",
      active: "bg-success",
      inactive: "bg-muted",
      rejected: "bg-destructive"
    };
    const labels = {
      pending_approval: "Pending",
      active: "Active",
      inactive: "Inactive",
      rejected: "Rejected"
    };
    return (
      <Badge className={`${colors[status as keyof typeof colors]} text-white`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const stats = [
    {
      title: "Total User",
      value: users.length,
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Pending Approval",
      value: users.filter(u => u.status === 'pending_approval').length,
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "Active",
      value: users.filter(u => u.status === 'active').length,
      icon: UserCheck,
      color: "text-success"
    },
    {
      title: "Rejected",
      value: users.filter(u => u.status === 'rejected').length,
      icon: UserX,
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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Admin Pusat Dashboard
              </h1>
              <p className="text-white/80 text-sm">Manajemen User SI CUTI</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 hidden md:flex"
                onClick={() => navigate("/templates")}
              >
                <FileText className="w-4 h-4 mr-2" />
                Kelola Template
              </Button>
              <div className="text-right hidden sm:block">
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-sm text-white/80">Admin Pusat</p>
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
        {/* Stats */}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari NIP, nama, atau email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar User</CardTitle>
            <CardDescription>Kelola user dan approval pendaftaran</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.nip}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{user.unit?.name || "-"}</p>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.user_roles)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.status === 'pending_approval' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setApproveDialog(true);
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setRejectDialog(true);
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {user.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.user_roles[0]?.role || 'user');
                                setChangeRoleDialog(true);
                              }}
                            >
                              <Shield className="w-4 h-4 mr-1" />
                              Change Role
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Pendaftaran</DialogTitle>
            <DialogDescription>
              Anda yakin ingin menyetujui pendaftaran user <strong>{selectedUser?.full_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleApprove} className="bg-success hover:bg-success/90">
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pendaftaran</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk user <strong>{selectedUser?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alasan Penolakan *</Label>
              <Textarea
                placeholder="Masukkan alasan penolakan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleReject} 
              variant="destructive"
              disabled={!rejectionReason}
            >
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleDialog} onOpenChange={setChangeRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Role User</DialogTitle>
            <DialogDescription>
              Ubah role untuk user <strong>{selectedUser?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role Baru</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin_unit">Admin Unit</SelectItem>
                  <SelectItem value="admin_pusat">Admin Pusat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleChangeRole} className="bg-gradient-primary">
              Ubah Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPusatDashboard;
