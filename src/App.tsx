import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LeaveApplication from "./pages/LeaveApplication";
import PendingApproval from "./pages/PendingApproval";
import Unauthorized from "./pages/Unauthorized";
import AdminPusatDashboard from "./pages/AdminPusatDashboard";
import TemplateManagement from "./pages/TemplateManagement";
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
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireActive>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leave/new" 
              element={
                <ProtectedRoute requireActive>
                  <LeaveApplication />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-pusat" 
              element={
                <ProtectedRoute requireRole="admin_pusat" requireActive>
                  <AdminPusatDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/approvals" 
              element={
                <ProtectedRoute requireActive>
                  <PendingApproval />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/templates" 
              element={
                <ProtectedRoute requireRole="admin_pusat" requireActive>
                  <TemplateManagement />
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
