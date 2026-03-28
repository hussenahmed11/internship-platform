import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

interface SyncResult {
  success: boolean;
  syncedCount: number;
  totalAuthUsers: number;
  totalProfiles: number;
  syncedUsers: { email: string; role: string }[];
  errors: string[];
  message: string;
}

export function SyncUsersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setLoading(true);
    setResult(null);

    try {
      // First try the Edge Function
      const { data, error } = await supabase.functions.invoke("sync-users");

      if (error) {
        // Fallback to RPC function if Edge Function is not deployed
        console.warn("Edge function not available, trying RPC function...", error);
        
        const { data: rpcData, error: rpcError } = await supabase.rpc("sync_auth_users_to_profiles");
        
        if (rpcError) {
          throw new Error(rpcError.message);
        }
        
        const syncResult = rpcData;
        setResult({
          success: syncResult.success,
          syncedCount: syncResult.syncedCount,
          totalAuthUsers: 0,
          totalProfiles: 0,
          syncedUsers: [],
          errors: [],
          message: syncResult.message,
        });
        
        if (syncResult.syncedCount > 0) {
          toast.success(`Synced ${syncResult.syncedCount} users successfully`);
          // Invalidate queries to refresh dashboard data
          queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-pending-actions"] });
          queryClient.invalidateQueries({ queryKey: ["admin-role-distribution"] });
          queryClient.invalidateQueries({ queryKey: ["user-sync-status"] });
          queryClient.invalidateQueries({ queryKey: ["users"] });
        } else {
          toast.info("All users are already synced");
        }
        
        setShowDialog(true);
        return;
      }

      const syncResult = data as SyncResult;
      setResult(syncResult);

      if (syncResult.syncedCount > 0) {
        toast.success(`Synced ${syncResult.syncedCount} users successfully`);
        // Invalidate queries to refresh dashboard data
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["admin-pending-actions"] });
        queryClient.invalidateQueries({ queryKey: ["admin-role-distribution"] });
        queryClient.invalidateQueries({ queryKey: ["user-sync-status"] });
        queryClient.invalidateQueries({ queryKey: ["users"] });
      } else {
        toast.info("All users are already synced");
      }

      if (syncResult.errors.length > 0) {
        toast.warning(`${syncResult.errors.length} errors occurred during sync`);
      }

      setShowDialog(true);
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={loading}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Syncing..." : "Sync Users"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result?.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              Sync Complete
            </DialogTitle>
            <DialogDescription>
              {result?.message}
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-muted-foreground">Users Synced</p>
                  <p className="text-2xl font-bold text-green-600">{result.syncedCount}</p>
                </div>
                {result.totalAuthUsers > 0 && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Total Auth Users</p>
                    <p className="text-2xl font-bold">{result.totalAuthUsers}</p>
                  </div>
                )}
              </div>

              {result.syncedUsers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Newly Synced Users:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.syncedUsers.map((user, index) => (
                      <div
                        key={index}
                        className="text-sm bg-green-50 dark:bg-green-950 p-2 rounded flex justify-between"
                      >
                        <span className="truncate">{user.email}</span>
                        <span className="text-muted-foreground capitalize">{user.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-red-600">Errors:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
