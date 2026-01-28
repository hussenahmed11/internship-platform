import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/student" element={<DashboardLayout><StudentDashboard /></DashboardLayout>} />
            <Route path="/dashboard/employee" element={<DashboardLayout><CompanyDashboard /></DashboardLayout>} />
            <Route path="/dashboard/advisor" element={<DashboardLayout><AdvisorDashboard /></DashboardLayout>} />
            <Route path="/dashboard/coordinator" element={<DashboardLayout><CoordinatorDashboard /></DashboardLayout>} />
            <Route path="/dashboard/admin" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/users" element={<Users />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/reports" element={<FeaturePlaceholder title="System Reports" />} />
            <Route path="/help" element={<Help />} />

            {/* Placeholder routes for other roles */}
            <Route path="/applications" element={<FeaturePlaceholder title="Applications Management" />} />
            <Route path="/documents" element={<FeaturePlaceholder title="Document Storage" />} />
            <Route path="/messages" element={<FeaturePlaceholder title="Messaging System" />} />
            <Route path="/schedule" element={<FeaturePlaceholder title="Calendar & Scheduling" />} />
            <Route path="/internships/new" element={<FeaturePlaceholder title="Internship Creation" />} />
            <Route path="/listings" element={<FeaturePlaceholder title="My Listings" />} />
            <Route path="/interviews" element={<FeaturePlaceholder title="Interview Management" />} />
            <Route path="/advisees" element={<FeaturePlaceholder title="Advisee Monitoring" />} />
            <Route path="/approvals" element={<FeaturePlaceholder title="Approval Workflow" />} />
            <Route path="/evaluations" element={<FeaturePlaceholder title="Evaluation System" />} />
            <Route path="/students" element={<FeaturePlaceholder title="Student Directory" />} />
            <Route path="/companies" element={<FeaturePlaceholder title="Company Directory" />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
