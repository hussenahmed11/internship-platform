import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";
import { CheckCircle, XCircle, CheckSquare, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";

export default function AdvisorApprovals() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [feedbackApp, setFeedbackApp] = useState<any>(null);
  const [feedback, setFeedback] = useState("");

  const { data: faculty } = useQuery({
    queryKey: ["advisor-faculty", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculty").select("*").eq("profile_id", profile!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: adviseeIds } = useQuery({
    queryKey: ["advisor-advisee-ids", faculty?.id],
    enabled: !!faculty?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students").select("id").eq("advisor_id", faculty!.id);
      if (error) throw error;
      return data?.map(s => s.id) ?? [];
    },
  });

  const { data: applications, isLoading } = useQuery({
    queryKey: ["advisor-approvals", adviseeIds],
    enabled: !!adviseeIds?.length,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          students:student_id (
            student_id, major,
            profiles:profile_id (full_name, email)
          ),
          internships:internship_id (title, companies:company_id (company_name))
        `)
        .in("student_id", adviseeIds!)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pending = applications?.filter(a => a.advisor_approved === null) ?? [];
  const reviewed = applications?.filter(a => a.advisor_approved !== null) ?? [];

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved, notes }: { id: string; approved: boolean; notes?: string }) => {
      const update: any = { advisor_approved: approved };
      if (notes) update.notes = notes;
      const { error } = await supabase.from("applications").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["advisor-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["advisor-advisee-apps"] });
      toast.success(vars.approved ? "Application approved" : "Application rejected");
      setFeedbackApp(null);
      setFeedback("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const renderTable = (apps: typeof applications, showActions: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Applied</TableHead>
          {showActions ? <TableHead className="text-right">Actions</TableHead> : <TableHead>Decision</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {apps?.map((app) => {
          const student = app.students as any;
          const sp = student?.profiles;
          return (
            <TableRow key={app.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{sp?.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{sp?.email}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm">{(app.internships as any)?.title}</TableCell>
              <TableCell className="text-sm">{(app.internships as any)?.companies?.company_name}</TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{app.status}</Badge></TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
              </TableCell>
              {showActions ? (
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                      onClick={() => { setFeedbackApp(app); setFeedback(""); }}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600"
                      onClick={() => approveMutation.mutate({ id: app.id, approved: true })}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => approveMutation.mutate({ id: app.id, approved: false })}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              ) : (
                <TableCell>
                  <Badge className={app.advisor_approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    {app.advisor_approved ? "Approved" : "Rejected"}
                  </Badge>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Application Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and approve your advisees' internship applications</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Review</CardTitle>
            <CheckSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{pending.length}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{reviewed.length}</div>}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending {pending.length > 0 && <Badge variant="destructive" className="ml-1">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !pending.length ? (
                <p className="text-center py-8 text-muted-foreground">No applications pending your review</p>
              ) : renderTable(pending, true)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviewed">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !reviewed.length ? (
                <p className="text-center py-8 text-muted-foreground">No reviewed applications yet</p>
              ) : renderTable(reviewed, false)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Dialog */}
      <Dialog open={!!feedbackApp} onOpenChange={() => setFeedbackApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review with Feedback</DialogTitle>
            <DialogDescription>
              {(feedbackApp?.students as any)?.profiles?.full_name} — {(feedbackApp?.internships as any)?.title}
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Add feedback for the student..." value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} />
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="text-destructive" onClick={() => approveMutation.mutate({ id: feedbackApp?.id, approved: false, notes: feedback })}>
              Reject
            </Button>
            <Button onClick={() => approveMutation.mutate({ id: feedbackApp?.id, approved: true, notes: feedback })}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
