import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { SyncUsersButton } from "@/components/admin/SyncUsersButton";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { useUserSyncStatus } from "@/hooks/useUserSyncStatus";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Users, Building2, GraduationCap, Briefcase,
  AlertCircle, CheckCircle, Clock, Settings,
  BarChart3, ShieldAlert, UserX, FileWarning,
  Database, RefreshCw,
} from "lucide-react";

const COLORS = ["#8B5CF6", "#10B981", "#F59E0B", "#3B82F6", "#EF4444"];

export function AdminDashboard() {
  const navigate = useNavigate();
  const { data: health, isLoading: healthLoading } = useSystemHealth();
  const { data: syncStatus, isLoading: syncStatusLoading } = useUserSyncStatus();

  // Fetch real stats using RPC function (bypasses RLS for accurate counts)
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      try {
        // Try RPC function first (bypasses RLS)
        // Use the typed RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc("get_admin_dashboard_stats");
        
        if (!rpcError && rpcData) {
          const statsData = rpcData;
          return {
            totalUsers: statsData.totalUsers || 0,
            activeCompanies: statsData.activeCompanies || 0,
            students: statsData.students || 0,
            activeInternships: statsData.activeInternships || 0,
          };
        }
        
        // Fallback to direct queries if RPC fails
        console.warn("RPC function not available, falling back to direct queries:", rpcError);
        const [
          { count: totalUsers, error: usersError },
          { count: activeCompanies, error: companiesError },
          { count: students, error: studentsError },
          { count: activeInternships, error: internshipsError },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("companies").select("*", { count: "exact", head: true }).eq("verified", true),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
          supabase.from("internships").select("*", { count: "exact", head: true }).eq("status", "active"),
        ]);

        if (usersError) console.error("Error fetching users:", usersError);
        if (companiesError) console.error("Error fetching companies:", companiesError);
        if (studentsError) console.error("Error fetching students:", studentsError);
        if (internshipsError) console.error("Error fetching internships:", internshipsError);

        return {
          totalUsers: totalUsers || 0,
          activeCompanies: activeCompanies || 0,
          students: students || 0,
          activeInternships: activeInternships || 0,
        };
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        throw error;
      }
    },
    staleTime: 0, // Disable cache to always fetch fresh data
    refetchOnMount: true,
  });

  // Pending actions - also try RPC first
  const { data: pending, isLoading: pendingLoading, error: pendingError } = useQuery({
    queryKey: ["admin-pending-actions"],
    queryFn: async () => {
      try {
        // Try RPC function first
        const { data: rpcData, error: rpcError } = await supabase.rpc("get_admin_dashboard_stats");
        
        if (!rpcError && rpcData) {
          const statsData = rpcData;
          return {
            unverifiedCompanies: statsData.unverifiedCompanies || 0,
            pendingApplications: statsData.pendingApplications || 0,
            incompleteOnboarding: statsData.incompleteOnboarding || 0,
          };
        }
        
        // Fallback to direct queries
        const [
          { count: unverifiedCompanies, error: unverifiedError },
          { count: pendingApplications, error: applicationsError },
          { count: incompleteOnboarding, error: onboardingError },
        ] = await Promise.all([
          supabase.from("companies").select("*", { count: "exact", head: true }).eq("verified", false),
          supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "applied"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("onboarding_completed", false),
        ]);

        if (unverifiedError) console.error("Error fetching unverified companies:", unverifiedError);
        if (applicationsError) console.error("Error fetching pending applications:", applicationsError);
        if (onboardingError) console.error("Error fetching incomplete onboarding:", onboardingError);

        return {
          unverifiedCompanies: unverifiedCompanies || 0,
          pendingApplications: pendingApplications || 0,
          incompleteOnboarding: incompleteOnboarding || 0,
        };
      } catch (error) {
        console.error("Failed to fetch pending actions:", error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
  });

  // User growth by role (for pie chart) - try RPC first
  const { data: roleDistribution } = useQuery({
    queryKey: ["admin-role-distribution"],
    queryFn: async () => {
      // Try RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_role_distribution");
      
      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        return rpcData.map(item => ({
          name: item.role.charAt(0).toUpperCase() + item.role.slice(1),
          value: item.count,
        }));
      }
      
      // Fallback to direct query
      const { data } = await supabase.from("profiles").select("role");
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach((p) => { counts[p.role] = (counts[p.role] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Application funnel
  const { data: appFunnel } = useQuery({
    queryKey: ["admin-app-funnel"],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("status");
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach((a) => { counts[a.status || "applied"] = (counts[a.status || "applied"] || 0) + 1; });
      const order = ["applied", "interview", "waiting", "accepted", "rejected"];
      return order.map((s) => ({
        stage: s.charAt(0).toUpperCase() + s.slice(1),
        count: counts[s] || 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Internship status breakdown
  const { data: internshipStatus } = useQuery({
    queryKey: ["admin-internship-status"],
    queryFn: async () => {
      const { data } = await supabase.from("internships").select("status, created_at");
      if (!data) return [];

      // Group by month
      const months: Record<string, Record<string, number>> = {};
      data.forEach((i) => {
        const month = new Date(i.created_at).toLocaleDateString("en-US", { month: "short" });
        if (!months[month]) months[month] = {};
        months[month][i.status || "draft"] = (months[month][i.status || "draft"] || 0) + 1;
      });
      return Object.entries(months).map(([month, statuses]) => ({
        month,
        active: statuses.active || 0,
        draft: statuses.draft || 0,
        closed: statuses.closed || 0,
        filled: statuses.filled || 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Recent activity
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
        .select(`status, applied_at, students (profiles (full_name)), internships (title)`)
        .order("applied_at", { ascending: false })
        .limit(3);

      const activities: { action: string; entity: string; time: string; status: string }[] = [];
      recentUsers?.forEach((u) => {
        activities.push({
          action: `New ${u.role} registered`,
          entity: u.full_name || u.email,
          time: formatTimeAgo(u.created_at),
          status: "completed",
        });
      });
      recentApps?.forEach((a) => {
        activities.push({
          action: `Application ${a.status}`,
          entity: `${(a.students as any)?.profiles?.full_name || "Student"} → ${(a.internships as any)?.title || "Internship"}`,
          time: formatTimeAgo(a.applied_at),
          status: a.status === "accepted" ? "completed" : "pending",
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
    { label: "Unverified Companies", count: pending?.unverifiedCompanies || 0, icon: ShieldAlert, path: "/companies", color: "text-yellow-600" },
    { label: "Pending Applications", count: pending?.pendingApplications || 0, icon: FileWarning, path: "/internships", color: "text-orange-600" },
    { label: "Incomplete Onboarding", count: pending?.incompleteOnboarding || 0, icon: UserX, path: "/users", color: "text-red-600" },
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
        <div className="flex items-center gap-3">
          <SyncUsersButton />
          <CreateUserDialog />
        </div>
      </div>

      {/* Error Display */}
      {(statsError || pendingError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error loading dashboard data</h3>
                <p className="text-sm text-red-700 mt-1">
                  There was a problem fetching data from the database. Please check your connection and try refreshing the page.
                </p>
                {(statsError as Error)?.message && (
                  <p className="text-xs text-red-600 mt-2 font-mono">{(statsError as Error).message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stat.value?.toLocaleString()}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync Status Alert */}
      {!syncStatusLoading && syncStatus && syncStatus.missingProfiles > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Users Out of Sync</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {syncStatus.missingProfiles} authentication {syncStatus.missingProfiles === 1 ? 'user' : 'users'} {syncStatus.missingProfiles === 1 ? 'is' : 'are'} not synced with the profiles table.
                  Click "Sync Users" to synchronize them.
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-yellow-900 font-medium">Auth Users:</span>{" "}
                    <span className="text-yellow-700">{syncStatus.authUsers}</span>
                  </div>
                  <div>
                    <span className="text-yellow-900 font-medium">Profiles:</span>{" "}
                    <span className="text-yellow-700">{syncStatus.profiles}</span>
                  </div>
                  <div>
                    <span className="text-yellow-900 font-medium">Missing:</span>{" "}
                    <span className="text-yellow-700 font-bold">{syncStatus.missingProfiles}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State - No Data */}
      {/* Pending Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Actions</CardTitle>
              <CardDescription>Items requiring your attention</CardDescription>
            </div>
            {!pendingLoading && totalPending > 0 && <Badge variant="destructive">{totalPending} pending</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {pendingLoading ? (
            <div className="grid gap-4 md:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {pendingItems.map((item) => (
                <button key={item.label} onClick={() => navigate(item.path)} className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors text-left">
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

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown by role</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            {!roleDistribution ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="flex h-full">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                        {roleDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center gap-2 pl-4">
                  {roleDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Application Pipeline</CardTitle>
            <CardDescription>Application status funnel</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            {!appFunnel ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appFunnel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Internship Lifecycle */}
      <Card>
        <CardHeader>
          <CardTitle>Internship Lifecycle</CardTitle>
          <CardDescription>Posting trends by status over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          {!internshipStatus ? (
            <Skeleton className="h-full w-full" />
          ) : internshipStatus.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No internship data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={internshipStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="active" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="draft" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                <Area type="monotone" dataKey="closed" stackId="1" stroke="#6B7280" fill="#6B7280" fillOpacity={0.4} />
                <Area type="monotone" dataKey="filled" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
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
              <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !recentActivity?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      {activity.status === "completed" ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-yellow-600" />}
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
              <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Database Connection", status: health?.database?.status },
                  { label: "Authentication Service", status: health?.authentication?.status },
                  { label: "Applications Engine", status: health?.applications?.status },
                  { label: "Internships Service", status: health?.internships?.status },
                ].map((svc) => (
                  <div key={svc.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={svc.status} />
                      <span className="text-sm">{svc.label}</span>
                    </div>
                    {getHealthBadge(svc.status)}
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
