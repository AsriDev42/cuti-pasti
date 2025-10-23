import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

// Pages
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LeaveApplication from "./pages/LeaveApplication";
import PendingApproval from "./pages/PendingApproval";
import AdminPusatDashboard from "./pages/AdminPusatDashboard";
import TemplateManagement from "./pages/TemplateManagement";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes with layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireActive>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/new"
              element={
                <ProtectedRoute requireActive>
                  <AppLayout>
                    <LeaveApplication />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/history"
              element={
                <ProtectedRoute requireActive>
                  <AppLayout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold mb-2">Riwayat Cuti</h2>
                      <p className="text-muted-foreground">Halaman ini akan segera tersedia</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals"
              element={
                <ProtectedRoute requireActive>
                  <AppLayout>
                    <PendingApproval />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-pusat"
              element={
                <ProtectedRoute requireRole="admin_pusat" requireActive>
                  <AppLayout>
                    <AdminPusatDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute requireActive>
                  <AppLayout>
                    <TemplateManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requireActive>
                  <AppLayout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold mb-2">Profil Saya</h2>
                      <p className="text-muted-foreground">Halaman ini akan segera tersedia</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pending-approval"
              element={
                <ProtectedRoute>
                  <PendingApproval />
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;