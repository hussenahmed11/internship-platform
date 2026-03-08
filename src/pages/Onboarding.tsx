import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GraduationCap, Building2, BookOpen, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    // Common
    phone: "",
    department_id: "",
    // Student
    student_id: "",
    major: "",
    graduation_year: "",
    bio: "",
    skills: "",
    // Company
    company_name: "",
    industry: "",
    company_size: "",
    website: "",
    description: "",
    location: "",
    // Faculty
    title: "",
    office_location: "",
    office_hours: "",
    specialization: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (profile?.onboarding_completed) {
      navigate("/dashboard");
      return;
    }

    fetchDepartments();
  }, [user, profile, navigate]);

  const fetchDepartments = async () => {
    const { data, error } = await supabase.from("departments").select("*");
    if (error) {
      console.error("Error fetching departments:", error);
      return;
    }
    setDepartments(data || []);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;

    setIsLoading(true);

    try {
      // Update profile with department
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          phone: formData.phone,
          department_id: formData.department_id || null,
          onboarding_completed: true,
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Create role-specific record
      if (profile.role === "student") {
        const { error: studentError } = await supabase.from("students").upsert({
          profile_id: profile.id,
          student_id: formData.student_id,
          major: formData.major,
          graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
          bio: formData.bio,
          skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()) : [],
        }, { onConflict: "profile_id" });

        if (studentError) throw studentError;
      } else if (profile.role === "company") {
        const { error: companyError } = await supabase.from("companies").insert({
          profile_id: profile.id,
          company_name: formData.company_name,
          industry: formData.industry,
          company_size: formData.company_size,
          website: formData.website,
          description: formData.description,
          location: formData.location,
        });

        if (companyError) throw companyError;
      } else if (profile.role === "advisor" || profile.role === "coordinator") {
        const { error: facultyError } = await supabase.from("faculty").upsert({
          profile_id: profile.id,
          title: formData.title,
          office_location: formData.office_location,
          office_hours: formData.office_hours,
          specialization: formData.specialization ? formData.specialization.split(",").map((s) => s.trim()) : [],
        }, { onConflict: "profile_id" });

        if (facultyError) throw facultyError;
      }

      await refreshProfile();
      toast.success("Profile completed successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfig: Record<string, { icon: any; color: string; bgColor: string; title: string; description: string }> = {
    student: {
      icon: GraduationCap,
      color: "text-student",
      bgColor: "bg-student-light",
      title: "Complete Your Student Profile",
      description: "Help us match you with the best internship opportunities",
    },
    company: {
      icon: Building2,
      color: "text-company",
      bgColor: "bg-company-light",
      title: "Set Up Your Company Profile",
      description: "Tell us about your organization to attract the best interns",
    },
    advisor: {
      icon: BookOpen,
      color: "text-advisor",
      bgColor: "bg-advisor-light",
      title: "Complete Your Advisor Profile",
      description: "Set up your profile to start guiding students",
    },
    coordinator: {
      icon: BookOpen,
      color: "text-coordinator",
      bgColor: "bg-coordinator-light",
      title: "Complete Your Coordinator Profile",
      description: "Set up your profile to manage department placements",
    },
    admin: {
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
      title: "Complete Your Admin Profile",
      description: "Set up your admin profile to get started",
    },
  };

  const config = roleConfig[profile?.role || "student"] || roleConfig.student;
  const Icon = config.icon;

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={formData.department_id}
              onValueChange={(value) => handleInputChange("department_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (step === 2) {
      if (profile?.role === "student") {
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID *</Label>
              <Input
                id="student_id"
                placeholder="e.g., STU-2024-001"
                value={formData.student_id}
                onChange={(e) => handleInputChange("student_id", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  placeholder="e.g., Computer Science"
                  value={formData.major}
                  onChange={(e) => handleInputChange("major", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graduation_year">Graduation Year</Label>
                <Select
                  value={formData.graduation_year}
                  onValueChange={(value) => handleInputChange("graduation_year", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027, 2028].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                placeholder="e.g., JavaScript, React, Python, SQL"
                value={formData.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );
      }

      if (profile?.role === "company") {
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                placeholder="e.g., TechCorp Inc."
                value={formData.company_name}
                onChange={(e) => handleInputChange("company_name", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., Technology"
                  value={formData.industry}
                  onChange={(e) => handleInputChange("industry", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_size">Company Size</Label>
                <Select
                  value={formData.company_size}
                  onValueChange={(value) => handleInputChange("company_size", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                placeholder="Tell us about your company..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );
      }

      // Faculty (advisor/coordinator)
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Associate Professor"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="office_location">Office Location</Label>
              <Input
                id="office_location"
                placeholder="e.g., Room 302, Building A"
                value={formData.office_location}
                onChange={(e) => handleInputChange("office_location", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="office_hours">Office Hours</Label>
              <Input
                id="office_hours"
                placeholder="e.g., Mon-Wed 2-4 PM"
                value={formData.office_hours}
                onChange={(e) => handleInputChange("office_hours", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Specializations (comma-separated)</Label>
            <Input
              id="specialization"
              placeholder="e.g., Machine Learning, Data Science"
              value={formData.specialization}
              onChange={(e) => handleInputChange("specialization", e.target.value)}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div
            className={cn(
              "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl",
              config.bgColor,
              config.color
            )}
          >
            <Icon className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                  step >= s
                    ? `${config.bgColor} ${config.color}`
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStepContent()}

          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} className="flex-1">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className={cn("flex-1", `bg-gradient-to-r ${config.color.replace("text-", "from-")} to-primary`)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
