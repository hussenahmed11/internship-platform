import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Users, CheckSquare, Calendar, BookOpen, ChevronRight, Clock, 
  AlertCircle, Briefcase, GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; class: string }> = {
  applied: { label: "Applied", class: "bg-muted text-muted-foreground" },
  interview: { label: "Interview", class: "bg-blue-100 text-blue-700" },
  waiting: { label: "Waiting", class: "bg-amber-100 text-amber-700" },
  accepted: { label: "Accepted", class: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", class: "bg-red-100 text-red-700" },
};

export function AdvisorDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Get faculty record for this advisor
  const { data: faculty } = useQuery({
    queryKey: ["advisor-faculty", profile?.id],
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

  // Get advisees (students assigned to this advisor)
  const { data: advisees, isLoading: loadingAdvisees } = useQuery({
    queryKey: ["advisor-advisees", faculty?.id],
    enabled: !!faculty?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          profiles:profile_id (full_name, email, avatar_url)
        `)
        .eq("advisor_id", faculty!.id);
      if (error) throw error;
      return data;
    },
  });

  // Get all applications for advisees
  const adviseeIds = advisees?.map(a => a.id) ?? [];
  const { data: adviseeApps, isLoading: loadingApps } = useQuery({
    queryKey: ["advisor-advisee-apps", adviseeIds],
    enabled: adviseeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          internships:internship_id (title, companies:company_id (company_name))
        `)
        .in("student_id", adviseeIds);
      if (error) throw error;
      return data;
    },
  });

  // Get pending approvals (advisor_approved is null)
  const pendingApprovals = adviseeApps?.filter(a => a.advisor_approved === null) ?? [];

  // Get evaluations due
  const { data: evaluations, isLoading: loadingEvals } = useQuery({
    queryKey: ["advisor-evaluations", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select(`
          *,
          applications:application_id (
            student_id,
            internships:internship_id (title, companies:company_id (company_name)),
            students:student_id (profiles:profile_id (full_name))
          )
        `)
        .eq("evaluator_id", profile!.id)
        .is("rating", null);
      if (error) throw error;
      return data;
    },
  });

  // Upcoming interviews for advisees
  const upcomingInterviews = adviseeApps?.filter(
    a => a.interview_date && new Date(a.interview_date) > new Date()
  ) ?? [];

  // Compute advisee placement progress
  const getAdviseeProgress = (studentId: string) => {
    const apps = adviseeApps?.filter(a => a.student_id === studentId) ?? [];
    if (apps.some(a => a.status === "accepted")) return 100;
    if (apps.some(a => a.status === "interview")) return 65;
    if (apps.some(a => a.status === "waiting")) return 50;
    if (apps.some(a => a.status === "applied")) return 30;
    return 10;
  };

  const getAdviseeStatus = (studentId: string) => {
    const apps = adviseeApps?.filter(a => a.student_id === studentId) ?? [];
    if (apps.some(a => a.status === "accepted")) return "accepted";
    if (apps.some(a => a.status === "interview")) return "interview";
    if (apps.some(a => a.status === "applied" || a.status === "waiting")) return "applied";
    return "searching";
  };

  const getAdviseeCompany = (studentId: string) => {
    const apps = adviseeApps?.filter(a => a.student_id === studentId) ?? [];
    const placed = apps.find(a => a.status === "accepted");
    if (placed) return (placed.internships as any)?.companies?.company_name;
    const interviewing = apps.find(a => a.status === "interview");
    if (interviewing) return (interviewing.internships as any)?.companies?.company_name;
    return null;
  };

  const isLoading = loadingAdvisees || loadingApps;

  const stats = [
    { label: "Total Advisees", value: advisees?.length ?? 0, change: `${advisees?.filter(a => getAdviseeStatus(a.id) === "searching").length ?? 0} need attention`, icon: Users, color: "text-advisor" },
    { label: "Pending Approvals", value: pendingApprovals.length, change: `${pendingApprovals.length} awaiting review`, icon: CheckSquare, color: "text-amber-500" },
    { label: "Evaluations Due", value: evaluations?.length ?? 0, change: "Incomplete", icon: BookOpen, color: "text-primary" },
    { label: "Upcoming Interviews", value: upcomingInterviews.length, change: "For your advisees", icon: Calendar, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advisor Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your advisees and manage approvals</p>
        </div>
        <Button className="bg-gradient-advisor text-white hover:opacity-90" onClick={() => navigate("/schedule")}>
          <Calendar className="mr-2 h-4 w-4" />
          View Schedule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="card-interactive">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <Icon className={cn("h-5 w-5", stat.color)} />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Advisees */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Advisees</CardTitle>
              <CardDescription>Track your students' placement progress</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/advisees")}>
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loadingAdvisees ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !advisees?.length ? (
              <p className="text-center py-8 text-muted-foreground">No advisees assigned yet</p>
            ) : (
              <div className="space-y-4">
                {advisees.slice(0, 5).map((advisee) => {
                  const status = getAdviseeStatus(advisee.id);
                  const progress = getAdviseeProgress(advisee.id);
                  const company = getAdviseeCompany(advisee.id);
                  const cfg = statusConfig[status] ?? { label: "Searching", class: "bg-muted text-muted-foreground" };
                  const p = advisee.profiles as any;
                  return (
                    <div key={advisee.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold">
                        {(p?.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{p?.full_name || "Unknown"}</p>
                          <Badge className={cfg.class}>{cfg.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {company ? (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />{company}
                            </span>
                          ) : "No placement yet"}
                        </p>
                      </div>
                      <div className="w-24 hidden sm:block">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progress</span><span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate("/advisees")}>View</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending Approvals
              {pendingApprovals.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingApprovals.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Applications requiring your review</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingApps ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : !pendingApprovals.length ? (
              <p className="text-center py-8 text-muted-foreground">No pending approvals</p>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.slice(0, 4).map((app) => {
                  const internship = app.internships as any;
                  return (
                    <div key={app.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{internship?.title || "Internship"}</p>
                          <p className="text-xs text-muted-foreground">{internship?.companies?.company_name}</p>
                        </div>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      </div>
                      <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => navigate("/approvals")}>
                        Review
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Evaluations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Evaluations Due</CardTitle>
            <CardDescription>Pending intern performance evaluations</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/evaluations")}>
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loadingEvals ? (
            <div className="grid gap-4 md:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
          ) : !evaluations?.length ? (
            <p className="text-center py-8 text-muted-foreground">No evaluations due</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {evaluations.slice(0, 3).map((evaluation) => {
                const appData = evaluation.applications as any;
                const studentName = appData?.students?.profiles?.full_name || "Student";
                const company = appData?.internships?.companies?.company_name || "Company";
                return (
                  <div key={evaluation.id} className="p-4 rounded-xl border bg-card hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{studentName}</p>
                        <p className="text-xs text-muted-foreground">{company}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created: {format(new Date(evaluation.created_at), "MMM d")}
                      </span>
                      <Button size="sm" onClick={() => navigate("/evaluations")}>Start</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
