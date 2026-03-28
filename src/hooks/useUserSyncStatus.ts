import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserSyncStatus {
  authUsers: number;
  profiles: number;
  missingProfiles: number;
  incompleteOnboarding: number;
  byRole: Record<string, number>;
}

export function useUserSyncStatus() {
  return useQuery({
    queryKey: ["user-sync-status"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_sync_status");
      
      if (error) {
        console.error("Error fetching sync status:", error);
        throw error;
      }
      
      return data as UserSyncStatus;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
