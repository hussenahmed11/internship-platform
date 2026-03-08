import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Building2, Briefcase, TrendingUp, ChevronRight, CheckSquare,
  AlertTriangle, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export function CoordinatorDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Students in coordinator's department
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["coord-students", profile?.department_id],
    queryFn: async () => {
      const query = supabase
        .from("profiles")
        .select("id, full_name, email, department_id")
        .eq("role", "student");
      if (profile?.department_id) {
        query.eq("department_id", profile.department_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // All companies
  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ["coord-companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // All internships
  const { data: internships, isLoading: loadingInternships } = useQuery({
    queryKey: ["coord-internships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select("*, companies(company_name), departments(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // All applications
  const { data: applications, isLoading: loadingApps } = useQuery({
    queryKey: ["coord-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          students:student_id (
            profile_id,
            profiles:profile_id (full_name, department_id)
          ),
          internships:internship_id (title, company_id, companies(company_name))
        `)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingStudents || loadingCompanies || loadingInternships || loadingApps;

  const totalStudents = students?.length ?? 0;
  const pendingCompanies = companies?.filter(c => !c.verified).length ?? 0;
  const verifiedCompanies = companies?.filter(c => c.verified).length ?? 0;
  const draftInternships = internships?.filter(i => i.status === "draft").length ?? 0;
  const activeInternships = internships?.filter(i => i.status === "active").length ?? 0;
  const placedStudents = applications?.filter(a => a.status === "accepted").length ?? 0;
  const pendingApprovals = draftInternships + pendingCompanies;

  // Placement pipeline
  const pipeline = [
    { stage: "Searching", count: totalStudents - (applications?.length ?? 0), color: "bg-muted-foreground/30" },
    { stage: "Applied", count: applications?.filter(a => a.status === "applied").length ?? 0, color: "bg-amber-400" },
    { stage: "Interviewing", count: applications?.filter(a => a.status === "interview").length ?? 0, color: "bg-blue-500" },
    { stage: "Placed", count: placedStudents, color: "bg-green-600" },
  ].filter(p => p.count > 0);
  const totalPipeline = Math.max(pipeline.reduce((s, p) => s + p.count, 0), 1);

  // Pending actions
  const pendingActions = [
    { type: "Company Verification", count: pendingCompanies, priority: pendingCompanies > 0 ? "high" : "low", url: "/companies" },
    { type: "Internship Approval", count: draftInternships, priority: draftInternships > 0 ? "medium" : "low", url: "/approvals" },
    { type: "Pending Applications", count: applications?.filter(a => a.status === "applied" || a.status === "waiting").length ?? 0, priority: "medium", url: "/approvals" },
  ].filter(a => a.count > 0);

  // Recent placements (accepted)
  const recentPlacements = (applications ?? [])
    .filter(a => a.status === "accepted")
    .slice(0, 4);

  // Top companies by internship count
  const companyInternshipCounts: Record<string, { name: string; count: number }> = {};
  (internships ?? []).forEach(i => {
    const name = (i.companies as any)?.company_name || "Unknown";
    if (!companyInternshipCounts[i.company_id]) companyInternshipCounts[i.company_id] = { name, count: 0 };
    companyInternshipCounts[i.company_id].count++;
  });
  const topCompanies = Object.values(companyInternshipCounts).sort((a, b) => b.count - a.count).slice(0, 4);

  const stats = [
    { label: "Department Students", value: totalStudents, icon: Users, color: "text-blue-600" },
    { label: "Partner Companies", value: verifiedCompanies, icon: Building2, color: "text-primary" },
    { label: "Active Positions", value: activeInternships, icon: Briefcase, color: "text-amber-600" },
    { label: "Placement Rate", value: totalStudents > 0 ? `${Math.round((placedStudents / totalStudents) * 100)}%` : "0%", icon: TrendingUp, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Coordinator</h1>
          <p className="text-muted-foreground mt-1">Manage placements and oversee department operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/analytics")}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Reports
          </Button>
          <Button onClick={() => navigate("/approvals")}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Review Queue {pendingApprovals > 0 && <Badge variant="secondary" className="ml-2">{pendingApprovals}</Badge>}
          </Button>
        </div>
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
                  <div className="text-3xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placement Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Placement Pipeline</CardTitle>
          <CardDescription>Student placement stages overview</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <div className="space-y-4">
              {pipeline.map((stage, index) => {
                const percentage = (stage.count / totalPipeline) * 100;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground">{stage.count} students ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", stage.color)} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending Actions
              {pendingActions.filter(a => a.priority === "high").length > 0 && (
                <Badge variant="destructive">{pendingActions.filter(a => a.priority === "high").length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : pendingActions.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">All caught up! No pending actions.</p>
            ) : (
              <div className="space-y-3">
                {pendingActions.map((action, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      action.priority === "high" && "border-destructive/50 bg-destructive/5"
                    )}
                    onClick={() => navigate(action.url)}
                  >
                    <div className="flex items-center gap-3">
                      {action.priority === "high" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      <span className="text-sm font-medium">{action.type}</span>
                    </div>
                    <Badge variant="secondary">{action.count}</Badge>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/approvals")}>
              View All Actions
            </Button>
          </CardContent>
        </Card>

        {/* Recent Placements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Placements</CardTitle>
            <CardDescription>Latest successful placements</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : recentPlacements.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">No placements yet</p>
            ) : (
              <div className="space-y-4">
                {recentPlacements.map((app) => {
                  const studentName = (app.students as any)?.profiles?.full_name || "Unknown";
                  const internshipTitle = (app.internships as any)?.title || "";
                  const companyName = (app.internships as any)?.companies?.company_name || "";
                  const initials = studentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                  return (
                    <div key={app.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">{internshipTitle} @ {companyName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Companies</CardTitle>
              <CardDescription>By internship count</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/companies")}>
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : topCompanies.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">No companies yet</p>
            ) : (
              <div className="space-y-4">
                {topCompanies.map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-bold">
                        #{index + 1}
                      </div>
                      <span className="font-medium text-sm">{company.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{company.count}</p>
                      <p className="text-xs text-muted-foreground">internships</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
