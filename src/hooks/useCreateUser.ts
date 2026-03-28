import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/contexts/AuthContext";

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: AppRole;
  department_id?: string;
  phone?: string;
}

export function useCreateUser() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createUser = async (data: CreateUserData) => {
    setLoading(true);
    try {
      // First try the edge function
      const { data: result, error } = await supabase.functions.invoke("create-user", {
        body: data,
      });

      if (error) {
        // Edge Function not deployed - try alternative approach
        
        // Alternative: Create user via signUp and then update profile
        // This works because admin can create users this way
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.full_name,
              role: data.role,
            },
          },
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        if (!signUpData.user) {
          throw new Error("Failed to create user");
        }

        // The trigger should create the profile, but let's verify
        // Wait a moment for the trigger to execute
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check if profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", signUpData.user.id)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking profile:", checkError);
        }

        if (!existingProfile) {
          // Profile doesn't exist - create it manually
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              user_id: signUpData.user.id,
              email: data.email,
              full_name: data.full_name,
              role: data.role,
              department_id: data.department_id || null,
              phone: data.phone || null,
              onboarding_completed: false,
            });

          if (insertError) {
            console.error("Profile insert error:", insertError);
            throw new Error(`Failed to create profile: ${insertError.message}`);
          }
        } else {
          // Profile exists - update it and ensure onboarding is false
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              full_name: data.full_name,
              role: data.role,
              department_id: data.department_id || null,
              phone: data.phone || null,
              onboarding_completed: false,
            })
            .eq("user_id", signUpData.user.id);

          if (updateError) {
            console.warn("Profile update warning:", updateError);
          }
        }

        // Add to user_roles
        const { error: roleError } = await supabase.from("user_roles").upsert({
          user_id: signUpData.user.id,
          role: data.role,
        }, { onConflict: "user_id,role" });

        if (roleError) {
          console.warn("User role error:", roleError);
        }

        // Get the profile id for role-specific records
        const { data: profileData, error: profileFetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", signUpData.user.id)
          .single();

        if (profileFetchError) {
          console.error("Error fetching profile:", profileFetchError);
        }

        if (profileData) {
          // Create role-specific records
          if (data.role === "student") {
            const { error: studentError } = await supabase.from("students").upsert({
              profile_id: profileData.id,
              student_id: `STU${Date.now().toString().slice(-8)}`,
            }, { onConflict: "profile_id" });
            
            if (studentError) {
              console.warn("Student record error:", studentError);
            }
          } else if (data.role === "company") {
            const { error: companyError } = await supabase.from("companies").upsert({
              profile_id: profileData.id,
              company_name: data.full_name,
              verified: false,
            }, { onConflict: "profile_id" });
            
            if (companyError) {
              console.warn("Company record error:", companyError);
            }
          } else if (data.role === "advisor" || data.role === "coordinator") {
            const { error: facultyError } = await supabase.from("faculty").upsert({
              profile_id: profileData.id,
              title: data.role === "coordinator" ? "Department Coordinator" : "Academic Advisor",
            }, { onConflict: "profile_id" });
            
            if (facultyError) {
              console.warn("Faculty record error:", facultyError);
            }
          }
        }

        toast({
          title: "User created successfully",
          description: `${data.full_name} has been added as ${data.role}. They will need to verify their email.`,
        });

        return { success: true, user: signUpData.user };
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      toast({
        title: "User created successfully",
        description: `${data.full_name} has been added as ${data.role}`,
      });

      return { success: true, user: result.user };
    } catch (error: any) {
      toast({
        title: "Failed to create user",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { createUser, loading };
}
