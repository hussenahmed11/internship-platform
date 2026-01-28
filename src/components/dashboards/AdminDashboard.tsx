import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Database,
  FileText,
  ClipboardList,
  RefreshCw,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { StaffAccountCreation } from "@/components/admin/StaffAccountCreation";

import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminDashboard() {
  const { data, isLoading, isError } = useAdminDashboardData();
  const { data: healthData, isLoading: healthLoading } = useSystemHealth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["system-health"] });
  };

  const quickActions = [
    {
      label: "Manage Departments",
      icon: Building2,
      onClick: () => navigate("/departments"),
      description: "Add, edit, or remove departments"
    },
    {
      label: "User Management",
      icon: Users,
      onClick: () => navigate("/users"),
      description: "Manage all system users"
    },
    {
      label: "System Settings",
      icon: Settings,
      onClick: () => navigate("/admin/settings"),
      description: "Configure system settings"
    },
    {
      label: "View Analytics",
      icon: BarChart3,
      onClick: () => navigate("/analytics"),
      description: "Detailed system analytics"
    },
    {
      label: "All Internships",
      icon: Briefcase,
      onClick: () => navigate("/internships"),
      description: "Manage internship listings"
    },
    {
      label: "System Reports",
      icon: FileText,
      onClick: () => navigate("/reports"),
      description: "Generate system reports"
    },
  ];

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200">
        <h2 className="text-xl font-bold text-red-600">Error loading dashboard</h2>
        <p className="text-red-500 mt-2">Could not fetch system statistics. Please try again later.</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Users",
      value: isLoading ? "..." : data?.stats.users.toLocaleString(),
      change: `${data?.stats.roleStats?.student || 0} students, ${data?.stats.roleStats?.company || 0} companies`,
      icon: Users,
      color: "text-student"
    },
    {
      label: "Departments",
      value: isLoading ? "..." : data?.stats.departments.toLocaleString(),
      change: "Active departments",
      icon: Building2,
      color: "text-coordinator"
    },
    {
      label: "Active Internships",
      value: isLoading ? "..." : data?.stats.internships.toLocaleString(),
      change: `${data?.stats.internshipStats?.draft || 0} drafts, ${data?.stats.internshipStats?.closed || 0} closed`,
      icon: Briefcase,
      color: "text-company"
    },
    {
      label: "Applications",
      value: isLoading ? "..." : (data as any)?.stats.applications.toLocaleString(),
      change: `${(data as any)?.stats.acceptedApplications || 0} accepted`,
      icon: ClipboardList,
      color: "text-advisor"
    },
    {
      label: "Pending Verifications",
      value: isLoading ? "..." : (data as any)?.stats.pendingVerifications.toLocaleString(),
      change: "Companies awaiting review",
      icon: Shield,
      color: "text-amber-500"
    },
  ];

  const recentActivity = data?.activity || [];
  const departmentStats = data?.departmentStats || [];

  // Use real system health data
  const systemHealth = healthData ? [
    { name: "Database", ...healthData.database },
    { name: "Authentication", ...healthData.authentication },
    { name: "Applications", ...healthData.applications },
    { name: "Internships", ...healthData.internships },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            System-wide overview and administration
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading || healthLoading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", (isLoading || healthLoading) && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/analytics")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button
            className="bg-gradient-admin text-white hover:opacity-90"
            onClick={() => navigate("/admin/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
        </div>
      </div>

      {/* Stats */}
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
                <div className="text-3xl font-bold">
                  {isLoading ? <Skeleton className="h-9 w-24" /> : stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto flex-col gap-3 p-6 hover:bg-admin-light hover:border-admin transition-colors text-left"
                  onClick={action.onClick}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Icon className="h-6 w-6 text-admin" />
                    <div className="flex-1">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Staff Account Creation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-admin" />
              Staff Management
            </CardTitle>
            <CardDescription>Create accounts for staff members</CardDescription>
          </CardHeader>
          <CardContent>
            <StaffAccountCreation onAccountCreated={handleRefresh} />
          </CardContent>
        </Card>

        {/* Pending Verifications */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                Pending Review
              </CardTitle>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {(data as any)?.pendingCompanies?.length || 0}
              </Badge>
            </div>
            <CardDescription>Employers waiting for verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : (data as any)?.pendingCompanies?.length > 0 ? (
                (data as any).pendingCompanies.map((company: any) => (
                  <div key={company.id} className="flex items-center justify-between p-3 rounded-lg border bg-amber-50/50 border-amber-100">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-sm truncate">{company.company_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(company.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 border-amber-200 hover:bg-amber-100 text-amber-700 font-medium" onClick={() => navigate("/users?role=company")}>
                      Review
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">All clear! No pending requests.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>Service status overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))
              ) : (
                systemHealth.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {service.status === "healthy" ? (
                        <CheckCircle2 className="h-5 w-5 text-company" />
                      ) : service.status === "error" ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                      <div>
                        <span className="font-medium">{service.name}</span>
                        <p className="text-xs text-muted-foreground">{service.metric}</p>
                      </div>
                    </div>
                    <Badge
                      variant={service.status === "healthy" ? "default" : "secondary"}
                      className={
                        service.status === "healthy"
                          ? "bg-company"
                          : service.status === "error"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                      }
                    >
                      {service.uptime}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>System events and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                    <Skeleton className="h-2 w-2 rounded-full mt-2" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))
              ) : (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border",
                      activity.type === "warning" && "border-amber-300 bg-amber-50",
                      activity.type === "success" && "border-company/30 bg-company-light/30"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 h-2 w-2 rounded-full",
                      activity.type === "info" && "bg-student",
                      activity.type === "warning" && "bg-amber-500",
                      activity.type === "success" && "bg-company"
                    )} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Department Statistics</CardTitle>
          <CardDescription>Placement rates by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Students</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Placements</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Progress</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 px-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-12 ml-auto" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-12 ml-auto" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-12 ml-auto" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : departmentStats.length > 0 ? (
                  departmentStats.map((dept, index) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{dept.name}</div>
                          <div className="text-xs text-muted-foreground">{dept.code}</div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">{dept.students}</td>
                      <td className="text-right py-3 px-4">{dept.placements}</td>
                      <td className="text-right py-3 px-4">
                        <Badge className={dept.rate >= 70 ? "bg-company" : dept.rate >= 40 ? "bg-amber-500" : "bg-red-500"}>
                          {dept.rate}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24 ml-auto">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                dept.rate >= 70 ? "bg-company" : dept.rate >= 40 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.min(dept.rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No department data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
