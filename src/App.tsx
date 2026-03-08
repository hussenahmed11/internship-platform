import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Departments from "./pages/Departments";
import Users from "./pages/Users";
import Internships from "./pages/Internships";
import Analytics from "./pages/Analytics";
import AdminSettings from "./pages/AdminSettings";
import Help from "./pages/Help";
import FeaturePlaceholder from "./pages/FeaturePlaceholder";
import Companies from "./pages/Companies";
import Documents from "./pages/Documents";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { CompanyDashboard } from "@/components/dashboards/CompanyDashboard";
import { AdvisorDashboard } from "@/components/dashboards/AdvisorDashboard";
import { CoordinatorDashboard } from "@/components/dashboards/CoordinatorDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Dashboard redirect based on role */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Role-specific dashboards */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><DashboardLayout><StudentDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/employer/dashboard" element={<ProtectedRoute allowedRoles={["company"]}><DashboardLayout><CompanyDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/advisor/dashboard" element={<ProtectedRoute allowedRoles={["advisor"]}><DashboardLayout><AdvisorDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/coordinator/dashboard" element={<ProtectedRoute allowedRoles={["coordinator"]}><DashboardLayout><CoordinatorDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />

            {/* Onboarding */}
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

            {/* Admin-only routes */}
            <Route path="/departments" element={<ProtectedRoute allowedRoles={["admin", "coordinator"]}><DashboardLayout><Departments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><Users /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminSettings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AuditLogs /></DashboardLayout></ProtectedRoute>} />

            {/* Shared protected routes */}
            <Route path="/internships" element={<ProtectedRoute><DashboardLayout><Internships /></DashboardLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={["admin", "coordinator"]}><DashboardLayout><Analytics /></DashboardLayout></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><DashboardLayout><Help /></DashboardLayout></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DashboardLayout><Documents /></DashboardLayout></ProtectedRoute>} />
            <Route path="/companies" element={<ProtectedRoute allowedRoles={["coordinator", "admin"]}><DashboardLayout><Companies /></DashboardLayout></ProtectedRoute>} />

            {/* Protected placeholder routes */}
            <Route path="/reports" element={<ProtectedRoute allowedRoles={["admin", "coordinator"]}><DashboardLayout><FeaturePlaceholder title="System Reports" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute><DashboardLayout><FeaturePlaceholder title="Applications Management" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><DashboardLayout><FeaturePlaceholder title="Messaging System" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><DashboardLayout><FeaturePlaceholder title="Calendar & Scheduling" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/internships/new" element={<ProtectedRoute allowedRoles={["company"]}><DashboardLayout><FeaturePlaceholder title="Internship Creation" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/listings" element={<ProtectedRoute allowedRoles={["company"]}><DashboardLayout><FeaturePlaceholder title="My Listings" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/interviews" element={<ProtectedRoute allowedRoles={["company"]}><DashboardLayout><FeaturePlaceholder title="Interview Management" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/advisees" element={<ProtectedRoute allowedRoles={["advisor"]}><DashboardLayout><FeaturePlaceholder title="Advisee Monitoring" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute allowedRoles={["advisor", "coordinator"]}><DashboardLayout><FeaturePlaceholder title="Approval Workflow" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/evaluations" element={<ProtectedRoute allowedRoles={["advisor"]}><DashboardLayout><FeaturePlaceholder title="Evaluation System" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute allowedRoles={["coordinator", "admin"]}><DashboardLayout><FeaturePlaceholder title="Student Directory" /></DashboardLayout></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
