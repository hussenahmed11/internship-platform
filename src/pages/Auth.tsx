import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, Building2, Briefcase, Users } from "lucide-react";

export default function Auth() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.onboarding_completed) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        {/* Floating Icons */}
        <div className="absolute top-20 left-20 animate-pulse-subtle">
          <div className="glass-dark p-4 rounded-2xl">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="absolute top-40 right-32 animate-pulse-subtle" style={{ animationDelay: "0.5s" }}>
          <div className="glass-dark p-4 rounded-2xl">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="absolute bottom-40 left-32 animate-pulse-subtle" style={{ animationDelay: "1s" }}>
          <div className="glass-dark p-4 rounded-2xl">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="absolute bottom-20 right-20 animate-pulse-subtle" style={{ animationDelay: "1.5s" }}>
          <div className="glass-dark p-4 rounded-2xl">
            <Users className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 glass-dark px-4 py-2 rounded-full">
              <GraduationCap className="h-5 w-5 text-white" />
              <span className="text-white/90 text-sm font-medium">University-Grade Platform</span>
            </div>
            
            <h1 className="text-5xl font-bold text-white leading-tight">
              Internship
              <br />
              Placement
              <br />
              <span className="text-white/80">Management</span>
            </h1>
            
            <p className="text-lg text-white/70 max-w-md leading-relaxed">
              Students sign in with Google. Staff accounts are created by administrators. One secure, institutional platform.
            </p>

            {/* Stats */}
            <div className="flex gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-sm text-white/60">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-sm text-white/60">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">95%</div>
                <div className="text-sm text-white/60">Placement Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-lg animate-fade-in">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
