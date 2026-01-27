import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  Building2, 
  Users, 
  Briefcase, 
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap
} from "lucide-react";
import { useEffect } from "react";

const features = [
  {
    icon: GraduationCap,
    title: "For Students",
    description: "Discover internships, track applications, and build your career path",
  },
  {
    icon: Building2,
    title: "For Employers",
    description: "Post opportunities and find the best talent from top universities",
  },
  {
    icon: Users,
    title: "For Faculty",
    description: "Guide students and monitor their placement journey",
  },
];

const benefits = [
  { icon: CheckCircle2, text: "Streamlined application process" },
  { icon: Shield, text: "Secure and compliant platform" },
  { icon: Zap, text: "Real-time tracking and updates" },
];

export default function Index() {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl">InternHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-white/90 text-sm font-medium mb-6 animate-fade-in">
              <Briefcase className="h-4 w-4" />
              University-Grade Internship Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight animate-slide-up">
              Connect. Apply.
              <br />
              <span className="text-white/80">Launch Your Career.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
              The all-in-one platform that connects students with leading companies, 
              streamlines the placement process, and empowers academic oversight.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 px-8"
                onClick={() => navigate("/auth")}
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-12 mt-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">500+</div>
                <div className="text-sm text-white/60">Partner Companies</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">10K+</div>
                <div className="text-sm text-white/60">Students Placed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">95%</div>
                <div className="text-sm text-white/60">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">One Platform, Multiple Roles</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're a student seeking opportunities, a company looking for talent, 
              or faculty guiding the next generation - we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-8 border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Why Choose InternHub?
              </h2>
              <p className="text-muted-foreground mb-8">
                Built specifically for universities, our platform provides everything you need 
                to manage internship placements efficiently and securely.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-company-light text-company">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{benefit.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-student/5 rounded-2xl p-8 border">
              <div className="space-y-4">
                {["Browse Opportunities", "Apply with One Click", "Track Your Progress", "Get Placed!"].map((step, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Join thousands of students and companies already using InternHub 
            to streamline their internship process.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 px-8"
            onClick={() => navigate("/auth")}
          >
            Create Your Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-semibold">InternHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 InternHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
