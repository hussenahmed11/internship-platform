import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase, Users, Calendar, TrendingUp, ChevronRight, Plus, Eye, Clock,
  FileText, AlertCircle, ShieldAlert, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export function CompanyDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isVerified = profile?.company_status === "verified";
  const isPending = profile?.company_status === "pending";
  const isRejected = profile?.company_status === "rejected";

  // Get company record
  const { data: company } = useQuery({
    queryKey: ["my-company"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Get company internships
  const { data: internships, isLoading: loadingInternships } = useQuery({
    queryKey: ["my-internships", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  // Get applications to company internships
  const { data: applications, isLoading: loadingApps } = useQuery({
    queryKey: ["my-applications", company?.id],
    queryFn: async () => {
      if (!internships || internships.length === 0) return [];
      const internshipIds = internships.map((i) => i.id);
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          students:student_id (
            id, profile_id, student_id, major, gpa,
            profiles:profile_id (full_name, email, avatar_url)
          ),
          internships:internship_id (title)
        `)
        .in("internship_id", internshipIds)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!internships && internships.length > 0,
  });

  const activeListings = internships?.filter((i) => i.status === "active").length ?? 0;
  const totalApplications = applications?.length ?? 0;
  const shortlisted = applications?.filter((a) => a.status === "interview" || a.status === "accepted").length ?? 0;
  const interviewCount = applications?.filter((a) => a.status === "interview" && a.interview_date).length ?? 0;

  const recentApps = applications?.slice(0, 4) ?? [];
  const topListings = internships?.slice(0, 4) ?? [];

  const upcomingInterviews = (applications ?? [])
    .filter((a) => a.status === "interview" && a.interview_date && new Date(a.interview_date) >= new Date())
    .sort((a, b) => new Date(a.interview_date!).getTime() - new Date(b.interview_date!).getTime())
    .slice(0, 3);

  const stats = [
    { label: "Active Listings", value: activeListings, sub: `${internships?.filter(i => i.status === "draft").length ?? 0} drafts`, icon: Briefcase, color: "text-primary" },
    { label: "Total Applications", value: totalApplications, sub: `${applications?.filter(a => a.status === "applied").length ?? 0} new`, icon: FileText, color: "text-blue-600" },
    { label: "Shortlisted", value: shortlisted, sub: "interview + accepted", icon: Users, color: "text-green-600" },
    { label: "Interviews", value: interviewCount, sub: "scheduled", icon: Calendar, color: "text-amber-600" },
  ];

  const isLoading = loadingInternships || loadingApps;

  return (
    <div className="space-y-6 animate-fade-in">
      {isPending && (
        <Alert variant="default" className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Verification Pending</AlertTitle>
          <AlertDescription>
            Your account is currently under review. Once verified, you will be able to post internships and manage applications.
          </AlertDescription>
        </Alert>
      )}

      {isRejected && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Verification Rejected</AlertTitle>
          <AlertDescription>
            Your account verification has been rejected. Please contact the administrator for more information.
          </AlertDescription>
        </Alert>
      )}

      {isVerified && (
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium mb-2">
          <ShieldCheck className="h-4 w-4" />
          Verified Employer
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your internship listings and track candidates</p>
        </div>
        <Button
          onClick={() => navigate("/internships/new")}
          disabled={!isVerified}
          title={!isVerified ? "Verification required to post internships" : ""}
        >
          <Plus className="mr-2 h-4 w-4" />
          Post New Internship
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <Icon className={cn("h-5 w-5", stat.color)} />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Listings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Listings</CardTitle>
              <CardDescription>Manage your internship postings</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/listings")}>
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : topListings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No listings yet. Post your first internship!</p>
            ) : (
              <div className="space-y-4">
                {topListings.map((listing) => {
                  const appCount = applications?.filter(a => a.internship_id === listing.id).length ?? 0;
                  return (
                    <div key={listing.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{listing.title}</p>
                          <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                            {listing.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Deadline: {listing.deadline ? new Date(listing.deadline).toLocaleDateString() : "Flexible"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          {appCount}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate("/listings")}>Manage</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Interviews */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
            <CardDescription>Scheduled interviews</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : upcomingInterviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No upcoming interviews</p>
            ) : (
              <div className="space-y-4">
                {upcomingInterviews.map((app) => {
                  const student = app.students as any;
                  const studentProfile = student?.profiles;
                  const initials = (studentProfile?.full_name || "?")
                    .split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                  return (
                    <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{studentProfile?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground truncate">{(app.internships as any)?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{new Date(app.interview_date!).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.interview_date!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/interviews")}>
              View Full Schedule
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>New candidates who applied to your positions</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/applications")}>
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : recentApps.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No applications received yet</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {recentApps.map((app) => {
                const student = app.students as any;
                const studentProfile = student?.profiles;
                const initials = (studentProfile?.full_name || "?")
                  .split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                return (
                  <div key={app.id} className="p-4 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium">{studentProfile?.full_name || "Unknown"}</p>
                        <Badge variant="outline" className="text-xs capitalize">{app.status}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{(app.internships as any)?.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => navigate("/applications")}>Review</Button>
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
