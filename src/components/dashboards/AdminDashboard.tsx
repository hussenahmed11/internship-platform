import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import {
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  BarChart3,
} from "lucide-react";

export function AdminDashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: "Total Users", value: "1,234", icon: Users, trend: "+12%", color: "text-blue-600" },
    { label: "Active Companies", value: "89", icon: Building2, trend: "+5%", color: "text-green-600" },
    { label: "Students", value: "956", icon: GraduationCap, trend: "+8%", color: "text-purple-600" },
    { label: "Active Internships", value: "156", icon: Briefcase, trend: "+15%", color: "text-orange-600" },
  ];

  const quickActions = [
    { label: "Manage Users", icon: Users, path: "/users", description: "Add, edit, or remove users" },
    { label: "Departments", icon: Building2, path: "/departments", description: "Manage academic departments" },
    { label: "Analytics", icon: BarChart3, path: "/analytics", description: "View system analytics" },
    { label: "Settings", icon: Settings, path: "/admin/settings", description: "System configuration" },
  ];

  const recentActivities = [
    { action: "New company registered", entity: "Tech Solutions Ltd", time: "5 mins ago", status: "pending" },
    { action: "Student application submitted", entity: "John Doe", time: "15 mins ago", status: "completed" },
    { action: "Internship posted", entity: "Data Analyst Role", time: "1 hour ago", status: "completed" },
    { action: "Company verification pending", entity: "StartupXYZ", time: "2 hours ago", status: "pending" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            System overview and management
          </p>
        </div>
        <CreateUserDialog />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {stat.trend} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex-col items-start p-4 gap-2"
                onClick={() => navigate(action.path)}
              >
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
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
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
                    <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                      {activity.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Database Connection</span>
                </div>
                <Badge variant="default" className="bg-green-600">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Authentication Service</span>
                </div>
                <Badge variant="default" className="bg-green-600">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">File Storage</span>
                </div>
                <Badge variant="default" className="bg-green-600">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Email Service</span>
                </div>
                <Badge variant="secondary">Pending Setup</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
