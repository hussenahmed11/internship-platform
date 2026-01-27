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
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </DashboardLayout>
    );
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case "student":
        return <StudentDashboard />;
      case "company":
        return <CompanyDashboard />;
      case "advisor":
        return <AdvisorDashboard />;
      case "coordinator":
        return <CoordinatorDashboard />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>;
}
