import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  BookOpen, Star, GraduationCap, Clock, CheckCircle, Plus, Search,
  AlertCircle, Briefcase, X, ChevronRight, FileText, TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";

const LEARNING_OUTCOME_SUGGESTIONS = [
  "Technical proficiency",
  "Problem solving",
  "Communication skills",
  "Teamwork & collaboration",
  "Time management",
  "Initiative & proactivity",
  "Adaptability",
  "Professional conduct",
  "Critical thinking",
  "Leadership potential",
];

export default function Evaluations() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Dialog states
  const [evalDialog, setEvalDialog] = useState<any>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([]);
  const [customOutcome, setCustomOutcome] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewEvalDialog, setViewEvalDialog] = useState<any>(null);

  // Fetch faculty record for this advisor
  const { data: faculty } = useQuery({
    queryKey: ["eval-faculty", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch advisees
  const { data: advisees } = useQuery({
    queryKey: ["eval-advisees", faculty?.id],
    enabled: !!faculty?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`*, profiles:profile_id (full_name, email)`)
        .eq("advisor_id", faculty!.id);
      if (error) throw error;
      return data;
    },
  });

  // Fetch applications for advisees (for creating evaluations)
  const adviseeIds = advisees?.map((a) => a.id) ?? [];
  const { data: adviseeApps } = useQuery({
    queryKey: ["eval-advisee-apps", adviseeIds],
    enabled: adviseeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          internships:internship_id (title, companies:company_id (company_name)),
          students:student_id (id, profile_id, profiles:profile_id (full_name, email))
        `)
        .in("student_id", adviseeIds)
        .in("status", ["accepted", "interview", "waiting"]);
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing evaluations
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
            status,
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

  const pending = evaluations?.filter((e) => !e.rating) ?? [];
  const completed = evaluations?.filter((e) => !!e.rating) ?? [];

  // Get application IDs that already have evaluations from this advisor
  const evaluatedAppIds = new Set(evaluations?.map((e) => e.application_id) ?? []);

  // Applications available for new evaluations (not already evaluated)
  const availableApps = adviseeApps?.filter((app) => !evaluatedAppIds.has(app.id)) ?? [];

  // Search filter
  const filterEvals = (list: any[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((ev) => {
      const app = ev.applications as any;
      const student = app?.students?.profiles?.full_name || "";
      const company = app?.internships?.companies?.company_name || "";
      const position = app?.internships?.title || "";
      return (
        student.toLowerCase().includes(q) ||
        company.toLowerCase().includes(q) ||
        position.toLowerCase().includes(q)
      );
    });
  };

  const filteredPending = filterEvals(pending);
  const filteredCompleted = filterEvals(completed);

  // Average rating
  const avgRating = useMemo(() => {
    if (!completed.length) return 0;
    const sum = completed.reduce((acc, e) => acc + (e.rating || 0), 0);
    return (sum / completed.length).toFixed(1);
  }, [completed]);

  // Create evaluation mutation
  const createMutation = useMutation({
    mutationFn: async ({ applicationId }: { applicationId: string }) => {
      if (!profile?.id) throw new Error("Advisor profile not found. Please ensure you are logged in.");
      
      console.log("DEBUG: Creating evaluation", { applicationId, evaluatorId: profile.id });
      
      const { error } = await supabase.from("evaluations").insert({
        application_id: applicationId,
        evaluator_id: profile.id,
      });
      if (error) {
        console.error("DEBUG: Supabase Insert Error", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations-list"] });
      queryClient.invalidateQueries({ queryKey: ["eval-advisee-apps"] });
      queryClient.invalidateQueries({ queryKey: ["advisor-evaluations"] });
      toast.success("Evaluation created — ready for your review");
      setCreateDialog(false);
      setSelectedAppId("");
    },
    onError: (e: any) => {
      console.error("DEBUG: Mutation failed", e);
      toast.error(e.message || "Failed to create evaluation. Please verify database permissions.");
    },
  });

  // Submit evaluation mutation
  const submitMutation = useMutation({
    mutationFn: async ({
      id,
      rating,
      feedback,
      learning_outcomes,
    }: {
      id: string;
      rating: number;
      feedback: string;
      learning_outcomes: string[];
    }) => {
      const { error } = await supabase
        .from("evaluations")
        .update({ rating, feedback, learning_outcomes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations-list"] });
      queryClient.invalidateQueries({ queryKey: ["advisor-evaluations"] });
      toast.success("Evaluation submitted successfully!");
      resetEvalDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetEvalDialog = () => {
    setEvalDialog(null);
    setRating(0);
    setHoverRating(0);
    setFeedbackText("");
    setLearningOutcomes([]);
    setCustomOutcome("");
  };

  const addOutcome = (outcome: string) => {
    const trimmed = outcome.trim();
    if (trimmed && !learningOutcomes.includes(trimmed)) {
      setLearningOutcomes([...learningOutcomes, trimmed]);
    }
    setCustomOutcome("");
  };

  const removeOutcome = (outcome: string) => {
    setLearningOutcomes(learningOutcomes.filter((o) => o !== outcome));
  };

  const getRatingLabel = (r: number) => {
    const labels = ["", "Needs Improvement", "Below Average", "Satisfactory", "Good", "Excellent"];
    return labels[r] || "";
  };

  const renderStars = (value: number, interactive: boolean = false, size: string = "h-5 w-5") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(s)}
            onMouseEnter={() => interactive && setHoverRating(s)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`p-0.5 transition-all duration-150 ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          >
            <Star
              className={`${size} transition-colors ${
                s <= (interactive ? hoverRating || value : value)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderEvalCard = (ev: any, isPending: boolean) => {
    const app = ev.applications as any;
    const student = app?.students?.profiles?.full_name || "Student";
    const company = app?.internships?.companies?.company_name || "Company";
    const position = app?.internships?.title || "Internship";
    const status = app?.status || "unknown";

    return (
      <Card key={ev.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              isPending ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}>
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base">{student}</h3>
                <Badge variant={status === "accepted" ? "default" : "secondary"} className="text-xs">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />{position}
                </span>
                <span className="mx-1.5">·</span>
                {company}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(ev.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
              {ev.rating && (
                <div className="flex items-center gap-2 mt-2">
                  {renderStars(ev.rating)}
                  <span className="text-sm font-medium">{ev.rating}/5</span>
                  <span className="text-xs text-muted-foreground">— {getRatingLabel(ev.rating)}</span>
                </div>
              )}
              {ev.learning_outcomes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ev.learning_outcomes.map((lo: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs font-normal">
                      {lo}
                    </Badge>
                  ))}
                </div>
              )}
              {ev.feedback && (
                <p className="text-sm mt-2 text-muted-foreground line-clamp-2 italic">"{ev.feedback}"</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {isPending ? (
                <Button
                  onClick={() => {
                    setEvalDialog(ev);
                    setRating(0);
                    setHoverRating(0);
                    setFeedbackText("");
                    setLearningOutcomes([]);
                  }}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                >
                  <Star className="mr-1.5 h-4 w-4" />
                  Evaluate
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewEvalDialog(ev)}
                >
                  <FileText className="mr-1.5 h-4 w-4" />
                  View Details
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluations</h1>
          <p className="text-muted-foreground mt-1">Submit and review student performance evaluations</p>
        </div>
        <Button
          onClick={() => setCreateDialog(true)}
          className="bg-gradient-to-r from-primary to-blue-600 text-white hover:opacity-90"
          disabled={!availableApps.length}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Evaluation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
            <BookOpen className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-3xl font-bold">{pending.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pending.length > 0 ? "Awaiting your review" : "All caught up!"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-3xl font-bold">{completed.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completed.length > 0 ? "Evaluations submitted" : "No evaluations yet"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Average Rating</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{avgRating || "—"}</span>
                  {Number(avgRating) > 0 && (
                    <div className="flex">
                      {renderStars(Math.round(Number(avgRating)), false, "h-4 w-4")}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completed.length > 0 ? `Based on ${completed.length} evaluations` : "No data yet"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student, company, or position..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending{" "}
            {pending.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-xs">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed{" "}
            {completed.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {completed.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : !filteredPending.length ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <BookOpen className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {searchQuery ? "No matching evaluations" : "No evaluations pending"}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {searchQuery
                        ? "Try a different search term"
                        : availableApps.length > 0
                        ? "Create a new evaluation to get started"
                        : "Your advisees don't have any active applications yet"}
                    </p>
                  </div>
                  {!searchQuery && availableApps.length > 0 && (
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => setCreateDialog(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Evaluation
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPending.map((e) => renderEvalCard(e, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : !filteredCompleted.length ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {searchQuery ? "No matching completed evaluations" : "No completed evaluations"}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {searchQuery ? "Try a different search term" : "Completed evaluations will appear here"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredCompleted.map((e) => renderEvalCard(e, false))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Evaluation Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New Evaluation
            </DialogTitle>
            <DialogDescription>
              Select an advisee's application to create a performance evaluation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Select Application</Label>
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an advisee's application..." />
                </SelectTrigger>
                <SelectContent>
                  {availableApps.map((app) => {
                    const student = (app.students as any)?.profiles?.full_name || "Student";
                    const position = (app.internships as any)?.title || "Position";
                    const company = (app.internships as any)?.companies?.company_name || "Company";
                    return (
                      <SelectItem key={app.id} value={app.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{student}</span>
                          <span className="text-xs text-muted-foreground">
                            {position} at {company}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedAppId && (() => {
              const app = availableApps.find((a) => a.id === selectedAppId);
              if (!app) return null;
              const student = (app.students as any)?.profiles?.full_name || "Student";
              const position = (app.internships as any)?.title || "Position";
              const company = (app.internships as any)?.companies?.company_name || "Company";
              return (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{student}</p>
                        <p className="text-xs text-muted-foreground">
                          {position} · {company}
                        </p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {app.status?.charAt(0).toUpperCase() + (app.status?.slice(1) || "")}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {!availableApps.length && (
              <div className="text-center py-6">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No advisee applications available for evaluation.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Either all applications have been evaluated, or your advisees don't have active applications.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialog(false); setSelectedAppId(""); }}>
              Cancel
            </Button>
            <Button
              disabled={!selectedAppId || createMutation.isPending}
              onClick={() => createMutation.mutate({ applicationId: selectedAppId })}
              className="bg-gradient-to-r from-primary to-blue-600 text-white"
            >
              {createMutation.isPending ? "Creating..." : "Create Evaluation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Evaluation Dialog */}
      <Dialog open={!!evalDialog} onOpenChange={() => resetEvalDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Submit Evaluation
            </DialogTitle>
            <DialogDescription>
              {(evalDialog?.applications as any)?.students?.profiles?.full_name} —{" "}
              {(evalDialog?.applications as any)?.internships?.title} at{" "}
              {(evalDialog?.applications as any)?.internships?.companies?.company_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Performance Rating</Label>
              <div className="flex items-center gap-3">
                {renderStars(rating, true, "h-7 w-7")}
                {(hoverRating || rating) > 0 && (
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400 animate-fade-in">
                    {getRatingLabel(hoverRating || rating)}
                  </span>
                )}
              </div>
            </div>

            {/* Learning Outcomes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Learning Outcomes Demonstrated</Label>
              <div className="flex flex-wrap gap-1.5">
                {LEARNING_OUTCOME_SUGGESTIONS.map((lo) => {
                  const selected = learningOutcomes.includes(lo);
                  return (
                    <button
                      key={lo}
                      onClick={() => (selected ? removeOutcome(lo) : addOutcome(lo))}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 border ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      {selected && <span className="mr-1">✓</span>}
                      {lo}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add custom outcome..."
                  value={customOutcome}
                  onChange={(e) => setCustomOutcome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOutcome(customOutcome);
                    }
                  }}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!customOutcome.trim()}
                  onClick={() => addOutcome(customOutcome)}
                >
                  Add
                </Button>
              </div>
              {learningOutcomes.filter((lo) => !LEARNING_OUTCOME_SUGGESTIONS.includes(lo)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {learningOutcomes
                    .filter((lo) => !LEARNING_OUTCOME_SUGGESTIONS.includes(lo))
                    .map((lo) => (
                      <Badge key={lo} variant="secondary" className="gap-1">
                        {lo}
                        <button onClick={() => removeOutcome(lo)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Written Feedback</Label>
              <Textarea
                placeholder="Share detailed performance feedback, areas of strength, and suggestions for improvement..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {feedbackText.length} characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => resetEvalDialog()}>
              Cancel
            </Button>
            <Button
              disabled={!rating || submitMutation.isPending}
              onClick={() =>
                submitMutation.mutate({
                  id: evalDialog?.id,
                  rating,
                  feedback: feedbackText,
                  learning_outcomes: learningOutcomes,
                })
              }
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Evaluation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Evaluation Details Dialog */}
      <Dialog open={!!viewEvalDialog} onOpenChange={() => setViewEvalDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Evaluation Details
            </DialogTitle>
            <DialogDescription>
              {(viewEvalDialog?.applications as any)?.students?.profiles?.full_name} —{" "}
              {(viewEvalDialog?.applications as any)?.internships?.title}
            </DialogDescription>
          </DialogHeader>

          {viewEvalDialog && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Rating</Label>
                <div className="flex items-center gap-2">
                  {renderStars(viewEvalDialog.rating || 0, false, "h-6 w-6")}
                  <span className="font-semibold text-lg">{viewEvalDialog.rating}/5</span>
                  <span className="text-sm text-muted-foreground">
                    — {getRatingLabel(viewEvalDialog.rating || 0)}
                  </span>
                </div>
              </div>

              {viewEvalDialog.learning_outcomes?.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Learning Outcomes</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {viewEvalDialog.learning_outcomes.map((lo: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {lo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewEvalDialog.feedback && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Feedback</Label>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <p className="text-sm whitespace-pre-wrap">{viewEvalDialog.feedback}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Created: {format(new Date(viewEvalDialog.created_at), "MMM d, yyyy")}
                </span>
                {viewEvalDialog.updated_at && viewEvalDialog.updated_at !== viewEvalDialog.created_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated: {format(new Date(viewEvalDialog.updated_at), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewEvalDialog(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
