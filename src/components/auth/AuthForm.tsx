import { useState } from "react";
import { Eye, EyeOff, GraduationCap, Building2, Users, BookOpen, Shield, Loader2, Mail, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

interface RoleOption {
  value: AppRole;
  label: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

const roleOptions: RoleOption[] = [
  {
    value: "student",
    label: "Student",
    description: "Find internships and track applications",
    icon: GraduationCap,
    colorClass: "text-student",
    bgClass: "bg-student-light border-student",
  },
  {
    value: "company",
    label: "Employer",
    description: "Post internships and find talent",
    icon: Building2,
    colorClass: "text-company",
    bgClass: "bg-company-light border-company",
  },
  {
    value: "advisor",
    label: "Academic Advisor",
    description: "Guide students through placements",
    icon: BookOpen,
    colorClass: "text-advisor",
    bgClass: "bg-advisor-light border-advisor",
  },
  {
    value: "coordinator",
    label: "Coordinator",
    description: "Manage department placements",
    icon: Users,
    colorClass: "text-coordinator",
    bgClass: "bg-coordinator-light border-coordinator",
  },
];

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const { signIn, signUp, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();

  const [resendCooldown, setResendCooldown] = useState(0);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    const { error } = await resendConfirmationEmail(email);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Confirmation email resent!");
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const validateForm = (isSignUp: boolean) => {
    const newErrors: { email?: string; password?: string; name?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (isSignUp) {
      try {
        nameSchema.parse(fullName);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.name = e.errors[0].message;
        }
      }

      if (!selectedRole) {
        toast.error("Please select a role to continue");
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setIsLoading(true);
    const { error } = await signIn(email, password);

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        toast.error(
          <div className="flex flex-col gap-2">
            <span>Email not confirmed. Please check your inbox.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Confirmation Email"}
            </Button>
          </div>,
          { duration: 10000 }
        );
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(error.message);
      }
      setIsLoading(false);
      return;
    }

    toast.success("Welcome back!");
    navigate("/dashboard");
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    if (!selectedRole) return;

    setIsLoading(true);
    const { error } = await signUp(email, password, selectedRole, fullName);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message);
      }
      setIsLoading(false);
      return;
    }

    toast.success("Account created successfully! Please check your email to confirm your account.");
    navigate("/auth"); // Stay on auth page so they can sign in after confirmation
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-lg border-none shadow-xl bg-card/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to your account or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn("pl-10", errors.email && "border-destructive")}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type={showSignInPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn("pl-10 pr-10", errors.password && "border-destructive")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showSignInPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label>Select your role</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.value;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={cn(
                          "relative flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200",
                          "hover:scale-[1.02] hover:shadow-md",
                          isSelected
                            ? `${role.bgClass} border-current ${role.colorClass}`
                            : "bg-card border-border hover:border-muted-foreground/50"
                        )}
                      >
                        <Icon className={cn("h-6 w-6 mb-2", isSelected ? role.colorClass : "text-muted-foreground")} />
                        <span className={cn("font-medium text-sm", isSelected ? role.colorClass : "text-foreground")}>
                          {role.label}
                        </span>
                        <span className="text-xs text-muted-foreground text-center mt-1 leading-tight">
                          {role.description}
                        </span>
                        {isSelected && (
                          <div className={cn("absolute top-2 right-2 h-2 w-2 rounded-full", role.colorClass.replace("text-", "bg-"))} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={cn("pl-10", errors.name && "border-destructive")}
                    disabled={isLoading}
                  />
                </div>
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn("pl-10", errors.email && "border-destructive")}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showSignUpPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn("pl-10 pr-10", errors.password && "border-destructive")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showSignUpPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading || !selectedRole}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
