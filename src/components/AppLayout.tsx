import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Plus,
  ClipboardCheck,
  Shield,
  FileText,
  Calendar,
  Users,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile, isAdminPusat, isAdminUnit } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUnitAdmin, setIsUnitAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [profile]);

  const checkAdminStatus = async () => {
    const adminPusatStatus = await isAdminPusat();
    const adminUnitStatus = await isAdminUnit();
    setIsAdmin(adminPusatStatus);
    setIsUnitAdmin(adminUnitStatus);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userMenuItems = [
    {
      title: "Dashboard",
      icon: Home,
      url: "/dashboard",
      show: true,
    },
    {
      title: "Ajukan Cuti",
      icon: Plus,
      url: "/leave/new",
      show: true,
    },
    {
      title: "Riwayat Cuti",
      icon: Calendar,
      url: "/leave/history",
      show: true,
    },
  ];

  const adminMenuItems = [
    {
      title: "Persetujuan Cuti",
      icon: ClipboardCheck,
      url: "/approvals",
      show: isUnitAdmin || isAdmin,
    },
    {
      title: "Admin Pusat",
      icon: Shield,
      url: "/admin-pusat",
      show: isAdmin,
    },
    {
      title: "Kelola Template",
      icon: FileText,
      url: "/templates",
      show: isAdmin || isUnitAdmin,
    },
    {
      title: "Manajemen User",
      icon: Users,
      url: "/users",
      show: isAdmin,
    },
  ];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="bg-white border-r">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold">SI CUTI</span>
              <span className="text-xs text-muted-foreground">Sistem Cuti ASN</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userMenuItems
                  .filter((item) => item.show)
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.url)}
                        isActive={location.pathname === item.url}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {(isAdmin || isUnitAdmin) && (
            <SidebarGroup>
              <SidebarGroupLabel>Administrasi</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenuItems
                    .filter((item) => item.show)
                    .map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.url)}
                          isActive={location.pathname === item.url}
                          tooltip={item.title}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-primary text-white text-xs">
                        {profile?.full_name ? getInitials(profile.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold">{profile?.full_name}</span>
                      <span className="truncate text-xs text-muted-foreground">{profile?.nip}</span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-primary text-white text-xs">
                          {profile?.full_name ? getInitials(profile.full_name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{profile?.full_name}</span>
                        <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profil Saya
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">SI CUTI</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 bg-muted/30">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
