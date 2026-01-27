import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  CheckSquare, 
  Calendar, 
  BookOpen,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Total Advisees", value: "24", change: "4 need attention", icon: Users, color: "text-advisor" },
  { label: "Pending Approvals", value: "7", change: "3 urgent", icon: CheckSquare, color: "text-amber-500" },
  { label: "Evaluations Due", value: "5", change: "This week", icon: BookOpen, color: "text-coordinator" },
  { label: "Site Visits", value: "3", change: "Scheduled this month", icon: Calendar, color: "text-student" },
];

const advisees = [
  { name: "Alex Thompson", status: "placed", company: "TechCorp Inc.", progress: 100 },
  { name: "Maria Garcia", status: "interviewing", company: "DataFlow AI", progress: 75 },
  { name: "John Smith", status: "applying", company: null, progress: 40 },
  { name: "Emma Wilson", status: "searching", company: null, progress: 20 },
  { name: "David Lee", status: "placed", company: "CloudBase", progress: 100 },
];

const pendingApprovals = [
  { student: "Maria Garcia", type: "Internship Application", company: "DataFlow AI", urgent: true },
  { student: "John Smith", type: "Credit Request", company: null, urgent: true },
  { student: "Emma Wilson", type: "Internship Application", company: "StartupXYZ", urgent: false },
  { student: "Chris Brown", type: "Extension Request", company: "InnovateLab", urgent: false },
];

const upcomingEvaluations = [
  { student: "Alex Thompson", company: "TechCorp Inc.", dueDate: "Feb 5, 2026" },
  { student: "David Lee", company: "CloudBase", dueDate: "Feb 8, 2026" },
  { student: "Lisa Chen", company: "Enterprise Solutions", dueDate: "Feb 10, 2026" },
];

const statusConfig = {
  searching: { label: "Searching", class: "bg-muted text-muted-foreground" },
  applying: { label: "Applying", class: "status-pending" },
  interviewing: { label: "Interviewing", class: "status-interview" },
  placed: { label: "Placed", class: "status-approved" },
};

export function AdvisorDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advisor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your advisees and manage approvals
          </p>
        </div>
        <Button className="bg-gradient-advisor text-white hover:opacity-90">
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Office Hours
        </Button>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Advisees */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Advisees</CardTitle>
              <CardDescription>Track your students' placement progress</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {advisees.map((advisee, index) => {
                const status = statusConfig[advisee.status as keyof typeof statusConfig];
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-advisor-light text-advisor font-semibold">
                      {advisee.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{advisee.name}</p>
                        <Badge className={status.class}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {advisee.company ? (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {advisee.company}
                          </span>
                        ) : (
                          "No placement yet"
                        )}
                      </p>
                    </div>
                    <div className="w-24">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{advisee.progress}%</span>
                      </div>
                      <Progress value={advisee.progress} className="h-2" />
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending Approvals
              <Badge variant="destructive" className="ml-2">
                {pendingApprovals.filter(a => a.urgent).length} urgent
              </Badge>
            </CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.map((approval, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border",
                    approval.urgent ? "border-amber-300 bg-amber-50" : "bg-card"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{approval.student}</p>
                      <p className="text-xs text-muted-foreground">{approval.type}</p>
                      {approval.company && (
                        <p className="text-xs text-muted-foreground">{approval.company}</p>
                      )}
                    </div>
                    {approval.urgent && (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Evaluations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming Evaluations</CardTitle>
            <CardDescription>Intern evaluations due soon</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingEvaluations.map((evaluation, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border bg-card hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-advisor-light text-advisor">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{evaluation.student}</p>
                    <p className="text-xs text-muted-foreground">{evaluation.company}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due: {evaluation.dueDate}
                  </span>
                  <Button size="sm">
                    Start
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
