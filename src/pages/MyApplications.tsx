import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { ClipboardList, Search, Calendar, Clock, CheckCircle2, AlertCircle, XCircle, MapPin, Building2, ExternalLink } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  applied: { label: "Applied", class: "bg-muted text-muted-foreground", icon: Clock },
  interview: { label: "Interview", class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Calendar },
  waiting: { label: "Waiting", class: "bg-muted text-muted-foreground", icon: AlertCircle },
  accepted: { label: "Accepted", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", class: "bg-destructive/10 text-destructive", icon: XCircle },
};

export default function MyApplications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [withdrawApp, setWithdrawApp] = useState<any>(null);

  // Fetch student record
  const { data: student } = useQuery({
    queryKey: ["my-student", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ["student-applications", student?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          internships:internship_id (
            title, location, remote, deadline, duration, stipend,
            companies:company_id (company_name, location)
          )
        `)
        .eq("student_id", student!.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id,
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", appId)
        .eq("student_id", student!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-applications"] });
      toast.success("Application withdrawn");
      setWithdrawApp(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!applications) return [];
    return applications.filter(a => {
      const internship = a.internships as any;
      const matchSearch = !searchTerm ||
        internship?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship?.companies?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  // Stats
  const statusCounts = applications?.reduce((acc, a) => {
    acc[a.status || "applied"] = (acc[a.status || "applied"] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground mt-1">Track your submitted applications and their progress</p>
      </div>

      {/* Status Summary */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Card key={key} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter(key)}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{statusCounts[key] || 0}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by position or company..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No applications found</p>
          <p className="text-sm mt-1">Start browsing internships to apply!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const status = statusConfig[app.status || "applied"];
            const StatusIcon = status.icon;
            const internship = app.internships as any;
            const company = internship?.companies;
            const canWithdraw = app.status === "applied" || app.status === "waiting";

            return (
              <Card key={app.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg shrink-0">
                      {(company?.company_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{internship?.title || "Internship"}</h3>
                        <Badge className={cn("gap-1", status.class)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {company?.company_name || "Unknown"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {internship?.location || company?.location || "Remote"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Applied {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                        </span>
                      </div>
                      {app.interview_date && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Interview: {format(new Date(app.interview_date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      )}
                      {app.notes && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          Note: {app.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {canWithdraw && (
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setWithdrawApp(app)}>
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Withdraw Dialog */}
      <Dialog open={!!withdrawApp} onOpenChange={() => setWithdrawApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your application for "{(withdrawApp?.internships as any)?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawApp(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => withdrawApp && withdrawMutation.mutate(withdrawApp.id)} disabled={withdrawMutation.isPending}>
              {withdrawMutation.isPending ? "Withdrawing..." : "Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
