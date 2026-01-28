import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface StaffAccountCreationProps {
  onAccountCreated?: () => void;
}

export function StaffAccountCreation({ onAccountCreated }: StaffAccountCreationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "",
    departmentId: ""
  });
  const { profile } = useAuth();

  // Only admins can access this component
  if (profile?.role !== "admin") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Access denied. Only Admins can create staff accounts.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.fullName || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      // Create a profile entry for the staff member
      // They will need to sign up with this email to activate their account
      const { error } = await supabase.from("profiles").insert({
        user_id: crypto.randomUUID(), // Placeholder until actual signup
        email: formData.email,
        full_name: formData.fullName,
        role: formData.role as "advisor" | "coordinator" | "company",
        department_id: formData.departmentId || null,
        onboarding_completed: false
      });

      if (error) {
        throw error;
      }

      toast.success(`${formData.role} account created successfully for ${formData.fullName}`);
      
      // Reset form
      setFormData({
        email: "",
        fullName: "",
        role: "",
        departmentId: ""
      });

      onAccountCreated?.();
    } catch (error: any) {
      console.error("Error creating staff account:", error);
      toast.error(error.message || "Failed to create staff account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Staff Account
        </CardTitle>
        <CardDescription>
          Create accounts for company representatives, advisors, and coordinators. Only Admins can perform this action.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company Representative</SelectItem>
                  <SelectItem value="advisor">Advisor (Faculty)</SelectItem>
                  <SelectItem value="coordinator">Coordinator (Department)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Input
                id="department"
                type="text"
                placeholder="Department ID (if applicable)"
                value={formData.departmentId}
                onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">Important Notes:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• The account will be created with a temporary setup</li>
              <li>• The user will need to complete onboarding when they first sign in</li>
              <li>• Roles cannot be changed after account creation</li>
              <li>• Only university email addresses can self-register as students</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Staff Account
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
