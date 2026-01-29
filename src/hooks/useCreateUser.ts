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
        throw new Error(error.message);
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
