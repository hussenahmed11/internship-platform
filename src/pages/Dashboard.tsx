import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { CompanyDashboard } from "@/components/dashboards/CompanyDashboard";
import { AdvisorDashboard } from "@/components/dashboards/AdvisorDashboard";
import { CoordinatorDashboard } from "@/components/dashboards/CoordinatorDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      const roleMap: Record<string, string> = {
        student: "student",
        employee: "employee",
        advisor: "advisor",
        coordinator: "coordinator",
        super_admin: "admin"
      };
      const path = roleMap[profile.role] || "student";
      navigate(`/dashboard/${path}`, { replace: true });
    }
  }, [profile, loading, navigate]);

  if (loading || !profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">
            {loading ? "Loading..." : "Redirecting..."}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return null;
}
