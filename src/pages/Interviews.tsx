import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";
import { Calendar, Clock, User, CheckCircle, ArrowRight } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

export default function Interviews() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [nextStatus, setNextStatus] = useState("waiting");

  const { data: company } = useQuery({
    queryKey: ["my-company"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("profile_id", profile!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: internships } = useQuery({
    queryKey: ["my-internships", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("internships").select("id, title").eq("company_id", company!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  const { data: interviews, isLoading } = useQuery({
    queryKey: ["interviews", company?.id],
    queryFn: async () => {
      if (!internships || internships.length === 0) return [];
      const ids = internships.map(i => i.id);
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          students:student_id (
            id, profile_id,
            profiles:profile_id (full_name, email, phone)
          ),
          internships:internship_id (title)
        `)
        .in("internship_id", ids)
        .in("status", ["interview", "waiting", "accepted"])
        .not("interview_date", "is", null)
        .order("interview_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!internships && internships.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("applications").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("Updated successfully");
      setFeedbackOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openFeedback = (app: any) => {
    setSelectedApp(app);
    setFeedback(app.notes || "");
    setNextStatus("waiting");
    setFeedbackOpen(true);
  };

  const submitFeedback = () => {
    if (!selectedApp) return;
    updateMutation.mutate({
      id: selectedApp.id,
      updates: { status: nextStatus, notes: feedback },
    });
  };

  const upcoming = interviews?.filter(i => !isPast(new Date(i.interview_date!)) || isToday(new Date(i.interview_date!))) ?? [];
  const past = interviews?.filter(i => isPast(new Date(i.interview_date!)) && !isToday(new Date(i.interview_date!))) ?? [];

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);

  const InterviewCard = ({ app }: { app: any }) => {
    const sp = (app.students as any)?.profiles;
    const interviewDate = new Date(app.interview_date!);
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
          {getInitials(sp?.full_name || "?")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{sp?.full_name || "Unknown"}</p>
          <p className="text-sm text-muted-foreground">{(app.internships as any)?.title}</p>
          {sp?.email && <p className="text-xs text-muted-foreground">{sp.email}</p>}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            {format(interviewDate, "MMM d, yyyy")}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(interviewDate, "h:mm a")}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="capitalize">{app.status}</Badge>
          <Button variant="ghost" size="sm" onClick={() => openFeedback(app)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview Management</h1>
        <p className="text-muted-foreground mt-1">Track and manage candidate interviews</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Interviews</CardTitle>
          <CardDescription>{upcoming.length} scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : upcoming.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No upcoming interviews</p>
          ) : (
            <div className="space-y-3">{upcoming.map(app => <InterviewCard key={app.id} app={app} />)}</div>
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Interviews</CardTitle>
            <CardDescription>{past.length} completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">{past.map(app => <InterviewCard key={app.id} app={app} />)}</div>
          </CardContent>
        </Card>
      )}

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Interview Status</DialogTitle>
            <DialogDescription>
              Record feedback and move candidate to the next stage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Move to Stage</Label>
              <Select value={nextStatus} onValueChange={setNextStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="interview">Keep at Interview</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="accepted">Accept / Hire</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Feedback / Notes</Label>
              <Textarea rows={4} placeholder="Interview feedback, observations..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
            <Button onClick={submitFeedback} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
