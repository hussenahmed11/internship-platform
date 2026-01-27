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
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Total Users", value: "2,847", change: "+156 this month", icon: Users, color: "text-student" },
  { label: "Departments", value: "12", change: "All active", icon: Building2, color: "text-coordinator" },
  { label: "Active Internships", value: "234", change: "+45 new", icon: Briefcase, color: "text-company" },
  { label: "System Uptime", value: "99.9%", change: "Last 30 days", icon: Activity, color: "text-company" },
];

const systemHealth = [
  { name: "Database", status: "healthy", uptime: "99.99%" },
  { name: "Authentication", status: "healthy", uptime: "100%" },
  { name: "File Storage", status: "healthy", uptime: "99.95%" },
  { name: "Email Service", status: "warning", uptime: "98.5%" },
];

const recentActivity = [
  { action: "New department created", details: "Design Department", time: "2 hours ago", type: "info" },
  { action: "User role updated", details: "john@university.edu → Coordinator", time: "5 hours ago", type: "info" },
  { action: "Security alert", details: "Multiple failed login attempts detected", time: "1 day ago", type: "warning" },
  { action: "System backup completed", details: "All data backed up successfully", time: "1 day ago", type: "success" },
];

const departmentStats = [
  { name: "Computer Science", students: 456, placements: 420, rate: 92 },
  { name: "Business Admin", students: 312, placements: 298, rate: 95 },
  { name: "Engineering", students: 289, placements: 275, rate: 95 },
  { name: "Data Science", students: 234, placements: 221, rate: 94 },
  { name: "Design", students: 178, placements: 156, rate: 88 },
];

const quickActions = [
  { label: "Manage Departments", icon: Building2, href: "/departments" },
  { label: "User Management", icon: Users, href: "/users" },
  { label: "System Settings", icon: Settings, href: "/admin/settings" },
  { label: "Security Logs", icon: Shield, href: "/admin/security" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Reports", icon: FileText, href: "/reports" },
];

export function AdminDashboard() {
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
          <Button variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Backup
          </Button>
          <Button className="bg-gradient-admin text-white hover:opacity-90">
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
                <div className="text-3xl font-bold">{stat.value}</div>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 hover:bg-admin-light hover:border-admin transition-colors"
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs text-center">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
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
              {systemHealth.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {service.status === "healthy" ? (
                      <CheckCircle2 className="h-5 w-5 text-company" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    )}
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <Badge
                    variant={service.status === "healthy" ? "default" : "secondary"}
                    className={service.status === "healthy" ? "bg-company" : "bg-amber-100 text-amber-800"}
                  >
                    {service.uptime}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>System events and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
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
              ))}
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
                {departmentStats.map((dept, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{dept.name}</td>
                    <td className="text-right py-3 px-4">{dept.students}</td>
                    <td className="text-right py-3 px-4">{dept.placements}</td>
                    <td className="text-right py-3 px-4">
                      <Badge className={dept.rate >= 90 ? "bg-company" : "bg-amber-500"}>
                        {dept.rate}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-24 ml-auto">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              dept.rate >= 90 ? "bg-company" : "bg-amber-500"
                            )}
                            style={{ width: `${dept.rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
