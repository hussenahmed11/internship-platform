import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    // CRITICAL: Check if onboarding is needed (except on onboarding page itself)
    if (profile && !profile.onboarding_completed && !location.pathname.startsWith("/onboarding")) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // If on onboarding page but already completed, redirect to dashboard
    if (profile && profile.onboarding_completed && location.pathname.startsWith("/onboarding")) {
      const dashboardPath = getDashboardPath(profile.role);
      navigate(dashboardPath, { replace: true });
      return;
    }
  }, [user, profile, loading, allowedRoles, navigate, location, requireAuth]);

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading || (requireAuth && user && !profile)) {
        setTimedOut(true);
      }
    }, 10000); // 10 seconds timeout for profile load
    return () => clearTimeout(timer);
  }, [loading, user, profile, requireAuth]);

  if (loading || (requireAuth && user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="font-medium">Loading your account...</p>
            {loading ? (
              <p className="text-xs text-muted-foreground italic">Connecting to authenticator...</p>
            ) : !profile ? (
              <p className="text-xs text-muted-foreground italic">Retrieving profile data...</p>
            ) : null}
          </div>
          
          {timedOut && (
            <div className="mt-8 p-4 border border-dashed rounded-lg animate-fade-in max-w-sm">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">Taking longer than usual?</p>
              <p className="text-xs text-muted-foreground mb-4">
                We're having trouble retrieving your profile. This can happen if your account was not fully initialized.
              </p>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="w-full">
                  Retry Loading
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate("/auth")} className="w-full">
                  Back to Sign In
                </Button>
              </div>
            </div>
          )}
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
