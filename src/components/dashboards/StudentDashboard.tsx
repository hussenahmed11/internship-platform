import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  TrendingUp,
  ChevronRight,
  MapPin,
  Building2,
  Star,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";

const statusConfig: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  applied: { label: "Applied", class: "bg-muted text-muted-foreground", icon: Clock },
  interview: { label: "Interview", class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Calendar },
  waiting: { label: "Waiting", class: "bg-muted text-muted-foreground", icon: AlertCircle },
  accepted: { label: "Accepted", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", class: "bg-destructive/10 text-destructive", icon: AlertCircle },
};

export function StudentDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

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

  // Fetch applications with internship + company info
  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ["my-applications", student?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          internships:internship_id (
            title, location, remote, deadline, company_id,
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

  // Fetch recommended internships (active ones student hasn't applied to)
  const { data: recommended } = useQuery({
    queryKey: ["recommended-internships", student?.id],
    queryFn: async () => {
      const appliedIds = applications?.map(a => a.internship_id) || [];
      let query = supabase
        .from("internships")
        .select(`*, companies:company_id (company_name, location)`)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3);
      if (appliedIds.length > 0) {
        query = query.not("id", "in", `(${appliedIds.join(",")})`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id && applications !== undefined,
  });

  // Fetch document count
  const { data: docCount } = useQuery({
    queryKey: ["my-doc-count", profile?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", profile!.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!profile?.id,
  });

  // Compute stats
  const totalApps = applications?.length || 0;
  const interviewCount = applications?.filter(a => a.status === "interview").length || 0;
  const acceptedCount = applications?.filter(a => a.status === "accepted").length || 0;
  const upcomingInterviews = applications?.filter(a => a.interview_date && new Date(a.interview_date) > new Date()).length || 0;

  const stats = [
    { label: "Applications", value: totalApps.toString(), change: `${interviewCount} in progress`, icon: ClipboardList, color: "text-student" },
    { label: "Interviews", value: interviewCount.toString(), change: `${upcomingInterviews} upcoming`, icon: Calendar, color: "text-company" },
    { label: "Offers", value: acceptedCount.toString(), change: acceptedCount > 0 ? "Congratulations!" : "Keep applying", icon: Star, color: "text-amber-500" },
    { label: "Documents", value: (docCount || 0).toString(), change: "Manage your portfolio", icon: FileText, color: "text-coordinator" },
  ];

  // Upcoming deadlines from internships
  const deadlines = applications
    ?.filter(a => a.interview_date && new Date(a.interview_date) > new Date())
    .map(a => ({
      title: `Interview: ${(a.internships as any)?.title}`,
      date: format(new Date(a.interview_date!), "MMM d, yyyy h:mm a"),
      urgent: new Date(a.interview_date!).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000,
    })) || [];

  // Profile completion
  const profileFields = [
    student?.skills?.length,
    student?.resume_url,
    student?.bio,
    student?.major,
    student?.gpa,
    student?.linkedin_url,
    profile?.phone,
    profile?.avatar_url,
  ];
  const filledFields = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round((filledFields / profileFields.length) * 100);

  const recentApps = applications?.slice(0, 4) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your applications and discover new opportunities
          </p>
        </div>
        <Button className="bg-gradient-student text-white hover:opacity-90" onClick={() => navigate("/internships")}>
          <Briefcase className="mr-2 h-4 w-4" />
          Browse Internships
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="card-interactive">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={cn("h-5 w-5", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Application Tracker */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Application Tracker</CardTitle>
              <CardDescription>Your recent applications and their status</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/applications")}>
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {appsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentApps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No applications yet. Start browsing internships!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentApps.map((app) => {
                  const status = statusConfig[app.status || "applied"];
                  const StatusIcon = status.icon;
                  const internship = app.internships as any;
                  const companyName = internship?.companies?.company_name || "Unknown";
                  const initials = companyName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div
                      key={app.id}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/applications")}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{internship?.title || "Internship"}</p>
                        <p className="text-sm text-muted-foreground">{companyName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                        </span>
                        <Badge className={cn("gap-1", status.class)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines / Interviews */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Interviews and important dates</CardDescription>
          </CardHeader>
          <CardContent>
            {deadlines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      deadline.urgent ? "border-destructive/50 bg-destructive/5" : "bg-card"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-2 w-2 rounded-full",
                        deadline.urgent ? "bg-destructive" : "bg-muted-foreground"
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground">{deadline.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Internships */}
      {recommended && recommended.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recommended for You</CardTitle>
              <CardDescription>Latest opportunities you haven't applied to yet</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/internships")}>
              See All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {recommended.map((internship) => (
                <div
                  key={internship.id}
                  className="group relative p-4 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => navigate("/internships")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{(internship.companies as any)?.company_name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {internship.location || (internship.companies as any)?.location || "Remote"}
                        {internship.remote && (
                          <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                            Remote
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <h4 className="font-semibold mb-2">{internship.title}</h4>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {internship.skills_required?.slice(0, 3).map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <Button className="w-full" variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Completion */}
      <Card className="border-student/30 bg-student-light/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Complete Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                A complete profile increases your chances of getting hired
              </p>
            </div>
            <span className="text-2xl font-bold text-student">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="h-2" />
          <div className="mt-4 flex gap-2">
            {!student?.skills?.length && (
              <Button size="sm" variant="outline" onClick={() => navigate("/onboarding")}>
                Add Skills
              </Button>
            )}
            {!student?.resume_url && (
              <Button size="sm" variant="outline" onClick={() => navigate("/documents")}>
                Upload Resume
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
