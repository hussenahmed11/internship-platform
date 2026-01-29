import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPath } from "@/components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // Not authenticated - redirect to auth
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    // Profile loaded - redirect to role-specific dashboard
    if (profile) {
      const dashboardPath = getDashboardPath(profile.role);
      navigate(dashboardPath, { replace: true });
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {loading ? "Loading..." : "Redirecting to your dashboard..."}
        </p>
      </div>
    </div>
  );
}
