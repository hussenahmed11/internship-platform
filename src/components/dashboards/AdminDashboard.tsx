import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import {
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  BarChart3,
  ShieldAlert,
  UserX,
  FileWarning,
} from "lucide-react";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { data: health, isLoading: healthLoading } = useSystemHealth();

  // Fetch real stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: activeCompanies },
        { count: students },
        { count: activeInternships },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("companies").select("*", { count: "exact", head: true }).eq("verified", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("internships").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);

      return {
        totalUsers: totalUsers || 0,
        activeCompanies: activeCompanies || 0,
        students: students || 0,
        activeInternships: activeInternships || 0,
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  // Pending actions
  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending-actions"],
    queryFn: async () => {
      const [
        { count: unverifiedCompanies },
        { count: pendingApplications },
        { count: incompleteOnboarding },
      ] = await Promise.all([
        supabase.from("companies").select("*", { count: "exact", head: true }).eq("verified", false),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "applied"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("onboarding_completed", false),
      ]);
      return {
        unverifiedCompanies: unverifiedCompanies || 0,
        pendingApplications: pendingApplications || 0,
        incompleteOnboarding: incompleteOnboarding || 0,
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("full_name, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      const { data: recentApps } = await supabase
        .from("applications")
        .select(`
          status, applied_at,
          students (
            profiles (full_name)
          ),
          internships (title)
        `)
        .order("applied_at", { ascending: false })
        .limit(3);

      const activities: { action: string; entity: string; time: string; status: string }[] = [];

      recentUsers?.forEach(u => {
        activities.push({
          action: `New ${u.role} registered`,
          entity: u.full_name || u.email,
          time: formatTimeAgo(u.created_at),
          status: "completed"
        });
      });

      recentApps?.forEach(a => {
        activities.push({
          action: `Application ${a.status}`,
          entity: `${(a.students as any)?.profiles?.full_name || "Student"} → ${(a.internships as any)?.title || "Internship"}`,
          time: formatTimeAgo(a.applied_at),
          status: a.status === "accepted" ? "completed" : "pending"
        });
      });

      return activities.slice(0, 5);
    },
    staleTime: 60 * 1000,
  });

  const isLoading = statsLoading;

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-600" },
    { label: "Active Companies", value: stats?.activeCompanies, icon: Building2, color: "text-green-600" },
    { label: "Students", value: stats?.students, icon: GraduationCap, color: "text-purple-600" },
    { label: "Active Internships", value: stats?.activeInternships, icon: Briefcase, color: "text-orange-600" },
  ];

  const quickActions = [
    { label: "Manage Users", icon: Users, path: "/users", description: "Add, edit, or remove users" },
    { label: "Departments", icon: Building2, path: "/departments", description: "Manage academic departments" },
    { label: "Analytics", icon: BarChart3, path: "/analytics", description: "View system analytics" },
    { label: "Settings", icon: Settings, path: "/admin/settings", description: "System configuration" },
  ];

  const pendingItems = [
    {
      label: "Unverified Companies",
      count: pending?.unverifiedCompanies || 0,
      icon: ShieldAlert,
      path: "/companies",
      color: "text-yellow-600",
    },
    {
      label: "Pending Applications",
      count: pending?.pendingApplications || 0,
      icon: FileWarning,
      path: "/internships",
      color: "text-orange-600",
    },
    {
      label: "Incomplete Onboarding",
      count: pending?.incompleteOnboarding || 0,
      icon: UserX,
      path: "/users",
      color: "text-red-600",
    },
  ];

  const totalPending = pendingItems.reduce((s, i) => s + i.count, 0);

  const getHealthBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">Loading</Badge>;
    switch (status) {
      case "healthy": return <Badge className="bg-green-600">Healthy</Badge>;
      case "warning": return <Badge className="bg-yellow-500">Warning</Badge>;
      case "error": return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and management</p>
        </div>
        <CreateUserDialog />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value?.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Actions</CardTitle>
              <CardDescription>Items requiring your attention</CardDescription>
            </div>
            {!pendingLoading && totalPending > 0 && (
              <Badge variant="destructive">{totalPending} pending</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {pendingItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <item.icon className={`h-8 w-8 ${item.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button key={action.label} variant="outline" className="h-auto flex-col items-start p-4 gap-2" onClick={() => navigate(action.path)}>
                <action.icon className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & System Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !recentActivity?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      {activity.status === "completed" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.entity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={activity.status === "completed" ? "default" : "secondary"}>{activity.status}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health</CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={health?.database?.status} />
                    <span className="text-sm">Database Connection</span>
                  </div>
                  {getHealthBadge(health?.database?.status)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={health?.authentication?.status} />
                    <span className="text-sm">Authentication Service</span>
                  </div>
                  {getHealthBadge(health?.authentication?.status)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={health?.applications?.status} />
                    <span className="text-sm">Applications Engine</span>
                  </div>
                  {getHealthBadge(health?.applications?.status)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={health?.internships?.status} />
                    <span className="text-sm">Internships Service</span>
                  </div>
                  {getHealthBadge(health?.internships?.status)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status?: string }) {
  if (status === "healthy") return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === "warning") return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  if (status === "error") return <AlertCircle className="h-4 w-4 text-red-600" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
