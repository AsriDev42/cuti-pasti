import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  Shield,
  Building2,
  Calendar,
  Settings
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Unit {
  id: string;
  name: string;
  code: string;
  description: string;
  head_name: string;
  head_nip: string;
}

interface LeaveType {
  id: string;
  name: string;
  code: string;
  default_quota: number;
  description: string;
  requires_document: boolean;
}

interface Holiday {
  id: string;
  date: string;
  name: string;
  type: string;
  is_recurring: boolean;
}

const AdminPusatDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  
  // User Management State
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

  // Unit Management State
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitDialog, setUnitDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitForm, setUnitForm] = useState({
    name: "",
    code: "",
    description: "",
    head_name: "",
    head_nip: ""
  });

  // Leave Type State
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeDialog, setLeaveTypeDialog] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [leaveTypeForm, setLeaveTypeForm] = useState({
    name: "",
    code: "",
    default_quota: 0,
    description: "",
    requires_document: false
  });

  // Holiday State
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayDialog, setHolidayDialog] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayForm, setHolidayForm] = useState({
    date: "",
    name: "",
    type: "national",
    is_recurring: false
  });

  useEffect(() => {
    fetchUsers();
    fetchUnits();
    fetchLeaveTypes();
    fetchHolidays();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter]);

  // User Management Functions
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        unit:units!unit_id(name)
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

    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', selectedUser.id);

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

  // Unit Management Functions
  const fetchUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('name');

    if (!error && data) {
      setUnits(data);
    }
  };

  const handleSaveUnit = async () => {
    if (editingUnit) {
      const { error } = await supabase
        .from('units')
        .update(unitForm)
        .eq('id', editingUnit.id);

      if (error) {
        toast({ title: "Error", description: "Gagal mengupdate unit", variant: "destructive" });
      } else {
        toast({ title: "Berhasil", description: "Unit berhasil diupdate" });
        fetchUnits();
      }
    } else {
      const { error } = await supabase
        .from('units')
        .insert([unitForm]);

      if (error) {
        toast({ title: "Error", description: "Gagal menambah unit", variant: "destructive" });
      } else {
        toast({ title: "Berhasil", description: "Unit berhasil ditambahkan" });
        fetchUnits();
      }
    }
    setUnitDialog(false);
    setEditingUnit(null);
    setUnitForm({ name: "", code: "", description: "", head_name: "", head_nip: "" });
  };

  const handleDeleteUnit = async (id: string) => {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Gagal menghapus unit", variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Unit berhasil dihapus" });
      fetchUnits();
    }
  };

  // Leave Type Functions
  const fetchLeaveTypes = async () => {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .order('name');

    if (!error && data) {
      setLeaveTypes(data);
    }
  };

  const handleSaveLeaveType = async () => {
    if (editingLeaveType) {
      const { error } = await supabase
        .from('leave_types')
        .update(leaveTypeForm)
        .eq('id', editingLeaveType.id);

      if (error) {
        toast({ title: "Error", description: "Gagal mengupdate jenis cuti", variant: "destructive" });
      } else {
        toast({ title: "Berhasil", description: "Jenis cuti berhasil diupdate" });
        fetchLeaveTypes();
      }
    } else {
      const { error } = await supabase
        .from('leave_types')
        .insert([leaveTypeForm]);

      if (error) {
        toast({ title: "Error", description: "Gagal menambah jenis cuti", variant: "destructive" });
      } else {
        toast({ title: "Berhasil", description: "Jenis cuti berhasil ditambahkan" });
        fetchLeaveTypes();
      }
    }
    setLeaveTypeDialog(false);
    setEditingLeaveType(null);
    setLeaveTypeForm({ name: "", code: "", default_quota: 0, description: "", requires_document: false });
  };

  const handleDeleteLeaveType = async (id: string) => {
    const { error } = await supabase
      .from('leave_types')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Gagal menghapus jenis cuti", variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Jenis cuti berhasil dihapus" });
      fetchLeaveTypes();
    }
  };

  // Holiday Functions
  const fetchHolidays = async () => {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date');

    if (!error && data) {
      setHolidays(data);
    }
  };

  const handleSaveHoliday = async () => {
    if (editingHoliday) {
      const { error } = await supabase
        .from('holidays')
        .update(holidayForm)
        .eq('id', editingHoliday.id);

      if (error) {
        toast({ title: "Error", description: "Gagal mengupdate hari libur", variant: "destructive" });
      } else {
        toast({ title: "Berhasil", description: "Hari libur berhasil diupdate" });
        fetchHolidays();
      }
    } else {
      const { error } = await supabase
        .from('holidays')
        .insert([holidayForm]);

      if (error) {
        toast({ title: "Error", description: "Gagal menambah hari libur", variant: "destructive" });
      } else {
        toast({ title: "Berhasil", description: "Hari libur berhasil ditambahkan" });
        fetchHolidays();
      }
    }
    setHolidayDialog(false);
    setEditingHoliday(null);
    setHolidayForm({ date: "", name: "", type: "national", is_recurring: false });
  };

  const handleDeleteHoliday = async (id: string) => {
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Gagal menghapus hari libur", variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Hari libur berhasil dihapus" });
      fetchHolidays();
    }
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
    },
    {
      title: "Pending Approval",
      value: users.filter(u => u.status === 'pending_approval').length,
      icon: Clock,
    },
    {
      title: "Active",
      value: users.filter(u => u.status === 'active').length,
      icon: UserCheck,
    },
    {
      title: "Rejected",
      value: users.filter(u => u.status === 'rejected').length,
      icon: UserX,
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel Admin Pusat</h1>
        <p className="text-muted-foreground">Kelola sistem SI CUTI</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Unit Kerja
          </TabsTrigger>
          <TabsTrigger value="leave-settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Pengaturan Cuti
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Kalender Libur
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
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
        </TabsContent>

        {/* Unit Management Tab */}
        <TabsContent value="units" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Unit Kerja</CardTitle>
                <CardDescription>Kelola unit kerja di Ditjen Binalavotas</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingUnit(null);
                setUnitForm({ name: "", code: "", description: "", head_name: "", head_nip: "" });
                setUnitDialog(true);
              }}>
                <Building2 className="w-4 h-4 mr-2" />
                Tambah Unit
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Unit</TableHead>
                    <TableHead>Kepala Unit</TableHead>
                    <TableHead>NIP Kepala</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-mono">{unit.code}</TableCell>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>{unit.head_name || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{unit.head_nip || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingUnit(unit);
                              setUnitForm(unit);
                              setUnitDialog(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUnit(unit.id)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Settings Tab */}
        <TabsContent value="leave-settings" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Jenis Cuti & Quota</CardTitle>
                <CardDescription>Kelola jenis cuti dan quota default</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingLeaveType(null);
                setLeaveTypeForm({ name: "", code: "", default_quota: 0, description: "", requires_document: false });
                setLeaveTypeDialog(true);
              }}>
                <Settings className="w-4 h-4 mr-2" />
                Tambah Jenis Cuti
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Jenis Cuti</TableHead>
                    <TableHead>Quota Default</TableHead>
                    <TableHead>Butuh Dokumen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-mono">{type.code}</TableCell>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.default_quota} hari</TableCell>
                      <TableCell>
                        <Badge variant={type.requires_document ? "default" : "secondary"}>
                          {type.requires_document ? "Ya" : "Tidak"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingLeaveType(type);
                              setLeaveTypeForm(type);
                              setLeaveTypeDialog(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteLeaveType(type.id)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holidays Tab */}
        <TabsContent value="holidays" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kalender Hari Libur</CardTitle>
                <CardDescription>Kelola hari libur nasional dan cuti bersama</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingHoliday(null);
                setHolidayForm({ date: "", name: "", type: "national", is_recurring: false });
                setHolidayDialog(true);
              }}>
                <Calendar className="w-4 h-4 mr-2" />
                Tambah Hari Libur
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nama Hari Libur</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Berulang</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell>{new Date(holiday.date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>
                        <Badge variant={holiday.type === 'national' ? 'default' : 'secondary'}>
                          {holiday.type === 'national' ? 'Libur Nasional' : 'Cuti Bersama'}
                        </Badge>
                      </TableCell>
                      <TableCell>{holiday.is_recurring ? 'Ya' : 'Tidak'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingHoliday(holiday);
                              setHolidayForm(holiday);
                              setHolidayDialog(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Dialogs */}
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

      {/* Unit Dialog */}
      <Dialog open={unitDialog} onOpenChange={setUnitDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Edit Unit Kerja' : 'Tambah Unit Kerja'}</DialogTitle>
            <DialogDescription>
              {editingUnit ? 'Update informasi unit kerja' : 'Tambahkan unit kerja baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Unit *</Label>
                <Input
                  placeholder="Contoh: Sekretariat Ditjen"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kode Unit *</Label>
                <Input
                  placeholder="Contoh: SETDITJEN"
                  value={unitForm.code}
                  onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi unit kerja..."
                value={unitForm.description}
                onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Kepala Unit</Label>
                <Input
                  placeholder="Nama lengkap"
                  value={unitForm.head_name}
                  onChange={(e) => setUnitForm({ ...unitForm, head_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>NIP Kepala Unit</Label>
                <Input
                  placeholder="NIP"
                  value={unitForm.head_nip}
                  onChange={(e) => setUnitForm({ ...unitForm, head_nip: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveUnit} disabled={!unitForm.name || !unitForm.code}>
              {editingUnit ? 'Update' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Type Dialog */}
      <Dialog open={leaveTypeDialog} onOpenChange={setLeaveTypeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLeaveType ? 'Edit Jenis Cuti' : 'Tambah Jenis Cuti'}</DialogTitle>
            <DialogDescription>
              {editingLeaveType ? 'Update informasi jenis cuti' : 'Tambahkan jenis cuti baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Jenis Cuti *</Label>
                <Input
                  placeholder="Contoh: Cuti Tahunan"
                  value={leaveTypeForm.name}
                  onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kode *</Label>
                <Input
                  placeholder="Contoh: CT"
                  value={leaveTypeForm.code}
                  onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, code: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quota Default (hari) *</Label>
              <Input
                type="number"
                placeholder="12"
                value={leaveTypeForm.default_quota}
                onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, default_quota: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi jenis cuti..."
                value={leaveTypeForm.description}
                onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requires_document"
                checked={leaveTypeForm.requires_document}
                onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, requires_document: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="requires_document">Memerlukan dokumen pendukung</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveTypeDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveLeaveType} disabled={!leaveTypeForm.name || !leaveTypeForm.code}>
              {editingLeaveType ? 'Update' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Holiday Dialog */}
      <Dialog open={holidayDialog} onOpenChange={setHolidayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHoliday ? 'Edit Hari Libur' : 'Tambah Hari Libur'}</DialogTitle>
            <DialogDescription>
              {editingHoliday ? 'Update informasi hari libur' : 'Tambahkan hari libur baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal *</Label>
              <Input
                type="date"
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Hari Libur *</Label>
              <Input
                placeholder="Contoh: Hari Kemerdekaan"
                value={holidayForm.name}
                onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Jenis *</Label>
              <Select value={holidayForm.type} onValueChange={(value) => setHolidayForm({ ...holidayForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">Libur Nasional</SelectItem>
                  <SelectItem value="collective">Cuti Bersama</SelectItem>
                  <SelectItem value="custom">Libur Khusus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_recurring"
                checked={holidayForm.is_recurring}
                onChange={(e) => setHolidayForm({ ...holidayForm, is_recurring: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_recurring">Berulang setiap tahun</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHolidayDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveHoliday} disabled={!holidayForm.date || !holidayForm.name}>
              {editingHoliday ? 'Update' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPusatDashboard;