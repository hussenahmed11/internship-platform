import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Building2, 
  Briefcase, 
  BarChart3,
  ChevronRight,
  TrendingUp,
  CheckSquare,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Active Students", value: "342", change: "+12%", trend: "up", icon: Users, color: "text-student" },
  { label: "Partner Companies", value: "56", change: "+8%", trend: "up", icon: Building2, color: "text-company" },
  { label: "Open Positions", value: "89", change: "-5%", trend: "down", icon: Briefcase, color: "text-coordinator" },
  { label: "Placement Rate", value: "94%", change: "+3%", trend: "up", icon: TrendingUp, color: "text-company" },
];

const placementPipeline = [
  { stage: "Searching", count: 45, color: "bg-muted" },
  { stage: "Applying", count: 87, color: "bg-amber-400" },
  { stage: "Interviewing", count: 62, color: "bg-student" },
  { stage: "Placed", count: 148, color: "bg-company" },
];

const pendingActions = [
  { type: "Company Verification", count: 4, priority: "high" },
  { type: "Internship Approval", count: 7, priority: "medium" },
  { type: "Student Disputes", count: 2, priority: "high" },
  { type: "Extension Requests", count: 5, priority: "low" },
];

const recentPlacements = [
  { student: "Alex Thompson", company: "TechCorp Inc.", position: "Software Engineering Intern" },
  { student: "Maria Garcia", company: "DataFlow AI", position: "Data Science Intern" },
  { student: "John Smith", company: "CloudBase", position: "DevOps Intern" },
  { student: "Emma Wilson", company: "InnovateLab", position: "Product Design Intern" },
];

const topCompanies = [
  { name: "TechCorp Inc.", placements: 12, rating: 4.8 },
  { name: "DataFlow AI", placements: 8, rating: 4.6 },
  { name: "CloudBase", placements: 7, rating: 4.7 },
  { name: "Enterprise Solutions", placements: 6, rating: 4.5 },
];

export function CoordinatorDashboard() {
  const totalPipeline = placementPipeline.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Coordinator</h1>
          <p className="text-muted-foreground mt-1">
            Manage placements and oversee department operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Reports
          </Button>
          <Button className="bg-gradient-coordinator text-white hover:opacity-90">
            <CheckSquare className="mr-2 h-4 w-4" />
            Review Queue
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
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
                <div className={cn(
                  "text-xs mt-1 flex items-center gap-1",
                  stat.trend === "up" ? "text-company" : "text-destructive"
                )}>
                  <TrendIcon className="h-3 w-3" />
                  {stat.change} from last month
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placement Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Placement Pipeline</CardTitle>
          <CardDescription>Visual overview of student placement stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {placementPipeline.map((stage, index) => {
              const percentage = (stage.count / totalPipeline) * 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="text-muted-foreground">{stage.count} students ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", stage.color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending Actions
              <Badge variant="destructive">
                {pendingActions.filter(a => a.priority === "high").length}
              </Badge>
            </CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions.map((action, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    action.priority === "high" && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {action.priority === "high" && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm font-medium">{action.type}</span>
                  </div>
                  <Badge variant="secondary">{action.count}</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
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
            <div className="space-y-4">
              {recentPlacements.map((placement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-company-light text-company text-xs font-semibold">
                    {placement.student.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{placement.student}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {placement.position} @ {placement.company}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Companies</CardTitle>
              <CardDescription>By placement count</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCompanies.map((company, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-bold">
                      #{index + 1}
                    </div>
                    <span className="font-medium text-sm">{company.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{company.placements}</p>
                    <p className="text-xs text-muted-foreground">placements</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
