import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (requireAuth && !user) {
      navigate("/auth", { state: { from: location.pathname }, replace: true });
      return;
    }

    // No profile yet (still loading or needs onboarding)
    if (requireAuth && user && !profile) {
      return;
    }

    // Check role access
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      // Redirect to user's correct dashboard
      const dashboardPath = getDashboardPath(profile.role);
      navigate(dashboardPath, { replace: true });
      return;
    }

    // Check if onboarding is needed
    if (profile && !profile.onboarding_completed && !location.pathname.startsWith("/onboarding")) {
      navigate("/onboarding", { replace: true });
      return;
    }
  }, [user, profile, loading, allowedRoles, navigate, location, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (requireAuth && !user) {
    return null;
  }

  // Check role access
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}

export function getDashboardPath(role: AppRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "student":
      return "/student/dashboard";
    case "company":
      return "/employer/dashboard";
    case "advisor":
      return "/advisor/dashboard";
    case "coordinator":
      return "/coordinator/dashboard";
    default:
      return "/dashboard";
  }
}
