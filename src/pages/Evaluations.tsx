import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";
import { BookOpen, Star, GraduationCap, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";

export default function Evaluations() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [evalDialog, setEvalDialog] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  const { data: evaluations, isLoading } = useQuery({
    queryKey: ["evaluations-list", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select(`
          *,
          applications:application_id (
            student_id,
            internships:internship_id (title, companies:company_id (company_name)),
            students:student_id (profiles:profile_id (full_name, email))
          )
        `)
        .eq("evaluator_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pending = evaluations?.filter(e => !e.rating) ?? [];
  const completed = evaluations?.filter(e => !!e.rating) ?? [];

  const submitMutation = useMutation({
    mutationFn: async ({ id, rating, feedback }: { id: string; rating: number; feedback: string }) => {
      const { error } = await supabase.from("evaluations").update({ rating, feedback }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations-list"] });
      toast.success("Evaluation submitted");
      setEvalDialog(null);
      setRating(0);
      setFeedbackText("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const renderEvalCard = (ev: any, isPending: boolean) => {
    const app = ev.applications as any;
    const student = app?.students?.profiles?.full_name || "Student";
    const company = app?.internships?.companies?.company_name || "Company";
    const position = app?.internships?.title || "Internship";

    return (
      <Card key={ev.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{student}</h3>
              <p className="text-sm text-muted-foreground">{position} at {company}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(ev.created_at), "MMM d, yyyy")}
              </p>
              {ev.rating && (
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= ev.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  ))}
                  <span className="text-sm ml-1">{ev.rating}/5</span>
                </div>
              )}
              {ev.feedback && <p className="text-sm mt-2 text-muted-foreground line-clamp-2">{ev.feedback}</p>}
            </div>
            {isPending && (
              <Button onClick={() => { setEvalDialog(ev); setRating(0); setFeedbackText(""); }}>
                Evaluate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Evaluations</h1>
        <p className="text-muted-foreground mt-1">Submit and review student performance evaluations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
            <BookOpen className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{pending.length}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{completed.length}</div>}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending {pending.length > 0 && <Badge variant="destructive" className="ml-1">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {isLoading ? (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
          ) : !pending.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No evaluations pending</CardContent></Card>
          ) : (
            <div className="space-y-4">{pending.map(e => renderEvalCard(e, true))}</div>
          )}
        </TabsContent>
        <TabsContent value="completed">
          {isLoading ? (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
          ) : !completed.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No completed evaluations</CardContent></Card>
          ) : (
            <div className="space-y-4">{completed.map(e => renderEvalCard(e, false))}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Evaluation Dialog */}
      <Dialog open={!!evalDialog} onOpenChange={() => setEvalDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Evaluation</DialogTitle>
            <DialogDescription>
              {(evalDialog?.applications as any)?.students?.profiles?.full_name} — {(evalDialog?.applications as any)?.internships?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setRating(s)} className="p-1">
                    <Star className={`h-6 w-6 transition-colors ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Feedback</p>
              <Textarea placeholder="Performance feedback..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvalDialog(null)}>Cancel</Button>
            <Button disabled={!rating} onClick={() => submitMutation.mutate({ id: evalDialog?.id, rating, feedback: feedbackText })}>
              Submit Evaluation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
