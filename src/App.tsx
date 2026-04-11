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
import Schedule from "./pages/Schedule";
import Companies from "./pages/Companies";
import Documents from "./pages/Documents";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";
import PostInternship from "./pages/PostInternship";
import MyListings from "./pages/MyListings";
import EmployerApplications from "./pages/EmployerApplications";
import MyApplications from "./pages/MyApplications";
import Interviews from "./pages/Interviews";
import Messages from "./pages/Messages";
import StudentDirectory from "./pages/StudentDirectory";
import Approvals from "./pages/Approvals";
import AdvisorApprovals from "./pages/AdvisorApprovals";
import Advisees from "./pages/Advisees";
import StudentVerification from "./pages/StudentVerification";
import Evaluations from "./pages/Evaluations";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { CompanyDashboard } from "@/components/dashboards/CompanyDashboard";
import { AdvisorDashboard } from "@/components/dashboards/AdvisorDashboard";
import { CoordinatorDashboard } from "@/components/dashboards/CoordinatorDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import PlacementRecords from "./pages/PlacementRecords";
import { ThemeSync } from "@/components/ThemeSync";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeSync />
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

            {/* Employer routes */}
            <Route path="/internships/new" element={<ProtectedRoute allowedRoles={["company"]}><DashboardLayout><PostInternship /></DashboardLayout></ProtectedRoute>} />
            <Route path="/listings" element={<ProtectedRoute allowedRoles={["company"]}><DashboardLayout><MyListings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/interviews" element={<ProtectedRoute allowedRoles={["company"]}><DashboardLayout><Interviews /></DashboardLayout></ProtectedRoute>} />

            {/* Coordinator / shared routes */}
            <Route path="/students" element={<ProtectedRoute allowedRoles={["coordinator", "admin"]}><DashboardLayout><StudentDirectory /></DashboardLayout></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute allowedRoles={["advisor", "coordinator"]}><DashboardLayout><Approvals /></DashboardLayout></ProtectedRoute>} />
            <Route path="/placement-records" element={<ProtectedRoute allowedRoles={["admin", "coordinator"]}><DashboardLayout><PlacementRecords /></DashboardLayout></ProtectedRoute>} />

            {/* Shared protected routes */}
            <Route path="/internships" element={<ProtectedRoute><DashboardLayout><Internships /></DashboardLayout></ProtectedRoute>} />
            <Route path="/student/applications" element={<ProtectedRoute allowedRoles={["student"]}><DashboardLayout><MyApplications /></DashboardLayout></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute><DashboardLayout><EmployerApplications /></DashboardLayout></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><DashboardLayout><Messages /></DashboardLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={["admin", "coordinator"]}><DashboardLayout><Analytics /></DashboardLayout></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><DashboardLayout><Help /></DashboardLayout></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DashboardLayout><Documents /></DashboardLayout></ProtectedRoute>} />
            <Route path="/companies" element={<ProtectedRoute allowedRoles={["coordinator", "admin"]}><DashboardLayout><Companies /></DashboardLayout></ProtectedRoute>} />

            {/* Protected placeholder routes */}
            <Route path="/reports" element={<ProtectedRoute allowedRoles={["admin", "coordinator"]}><DashboardLayout><FeaturePlaceholder title="System Reports" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><DashboardLayout><Schedule /></DashboardLayout></ProtectedRoute>} />
            <Route path="/advisees" element={<ProtectedRoute allowedRoles={["advisor"]}><DashboardLayout><Advisees /></DashboardLayout></ProtectedRoute>} />
            <Route path="/advisor/verification" element={<ProtectedRoute allowedRoles={["advisor"]}><DashboardLayout><StudentVerification /></DashboardLayout></ProtectedRoute>} />
            <Route path="/evaluations" element={<ProtectedRoute allowedRoles={["advisor"]}><DashboardLayout><Evaluations /></DashboardLayout></ProtectedRoute>} />
            <Route path="/advisor/approvals" element={<ProtectedRoute allowedRoles={["advisor"]}><DashboardLayout><AdvisorApprovals /></DashboardLayout></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
 
