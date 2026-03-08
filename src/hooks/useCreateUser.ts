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
      const { data: result, error } = await supabase.functions.invoke("create-user", {
        body: data,
      });

      if (error) {
        // Edge Function not deployed - show manual instructions
        toast({
          title: "Edge Function Not Deployed",
          description: "Please create users manually through Supabase Dashboard. See instructions in CREATE_ADMIN_USER.md",
          variant: "destructive",
          duration: 10000,
        });
        
        // Open instructions in console
        console.log(`
===========================================
MANUAL USER CREATION REQUIRED
===========================================

The Supabase Edge Function is not deployed yet.
Please create users manually:

1. Go to: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/auth/users

2. Click "Add user" → "Create new user"
   - Email: ${data.email}
   - Password: ${data.password}
   - ✅ Check "Auto Confirm User"

3. Copy the User ID

4. Go to SQL Editor: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/sql/new

5. Run this SQL (replace USER_ID_HERE):

INSERT INTO profiles (user_id, email, full_name, role, department_id, phone, onboarding_completed)
VALUES (
  'USER_ID_HERE',
  '${data.email}',
  '${data.full_name}',
  '${data.role}',
  ${data.department_id ? `'${data.department_id}'` : 'NULL'},
  ${data.phone ? `'${data.phone}'` : 'NULL'},
  false
);

===========================================
        `);
        
        throw new Error("Edge Function not deployed. Check console for manual instructions.");
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
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { createUser, loading };
}
