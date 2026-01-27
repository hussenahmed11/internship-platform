import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Briefcase, 
  FileText, 
  Calendar, 
  Clock, 
  TrendingUp,
  ChevronRight,
  MapPin,
  Building2,
  Star,
  CheckCircle2,
  AlertCircle,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const stats = [
  { label: "Applications", value: "12", change: "+3 this week", icon: ClipboardList, color: "text-student" },
  { label: "Interviews", value: "4", change: "2 upcoming", icon: Calendar, color: "text-company" },
  { label: "Saved Jobs", value: "28", change: "+5 new matches", icon: Star, color: "text-amber-500" },
  { label: "Profile Views", value: "156", change: "+23%", icon: TrendingUp, color: "text-coordinator" },
];

const applications = [
  { 
    company: "TechCorp Inc.", 
    position: "Software Engineering Intern", 
    status: "interview", 
    date: "Jan 30, 2026",
    logo: "TC"
  },
  { 
    company: "DataFlow AI", 
    position: "Data Science Intern", 
    status: "applied", 
    date: "Jan 28, 2026",
    logo: "DF"
  },
  { 
    company: "CloudBase", 
    position: "DevOps Intern", 
    status: "waiting", 
    date: "Jan 25, 2026",
    logo: "CB"
  },
  { 
    company: "InnovateLab", 
    position: "Product Design Intern", 
    status: "accepted", 
    date: "Jan 20, 2026",
    logo: "IL"
  },
];

const recommendedInternships = [
  {
    id: 1,
    title: "Frontend Developer Intern",
    company: "StartupXYZ",
    location: "San Francisco, CA",
    remote: true,
    skills: ["React", "TypeScript", "CSS"],
    match: 95,
  },
  {
    id: 2,
    title: "Full Stack Developer Intern",
    company: "Enterprise Solutions",
    location: "New York, NY",
    remote: false,
    skills: ["Node.js", "PostgreSQL", "AWS"],
    match: 87,
  },
  {
    id: 3,
    title: "Mobile Developer Intern",
    company: "AppWorks",
    location: "Austin, TX",
    remote: true,
    skills: ["React Native", "iOS", "Android"],
    match: 82,
  },
];

const deadlines = [
  { title: "Submit Resume to Career Center", date: "Feb 1, 2026", urgent: true },
  { title: "TechCorp Interview Prep", date: "Feb 3, 2026", urgent: false },
  { title: "Complete Skills Assessment", date: "Feb 5, 2026", urgent: false },
];

const statusConfig = {
  applied: { label: "Applied", class: "status-pending", icon: Clock },
  interview: { label: "Interview", class: "status-interview", icon: Calendar },
  waiting: { label: "Waiting", class: "status-pending", icon: AlertCircle },
  accepted: { label: "Accepted", class: "status-approved", icon: CheckCircle2 },
  rejected: { label: "Rejected", class: "status-rejected", icon: AlertCircle },
};

export function StudentDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your applications and discover new opportunities
          </p>
        </div>
        <Button className="bg-gradient-student text-white hover:opacity-90">
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
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.map((app, index) => {
                const status = statusConfig[app.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                      {app.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{app.position}</p>
                      <p className="text-sm text-muted-foreground">{app.company}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {app.date}
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
          </CardContent>
        </Card>

        {/* Deadlines & To-Do */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Don't miss these important dates</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Recommended Internships */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recommended for You</CardTitle>
            <CardDescription>Based on your skills and interests</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            See All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendedInternships.map((internship) => (
              <div
                key={internship.id}
                className="group relative p-4 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Match Badge */}
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-gradient-student text-white border-0">
                    {internship.match}% Match
                  </Badge>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{internship.company}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {internship.location}
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
                  {internship.skills.map((skill) => (
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
            <span className="text-2xl font-bold text-student">75%</span>
          </div>
          <Progress value={75} className="h-2" />
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline">
              Add Skills
            </Button>
            <Button size="sm" variant="outline">
              Upload Resume
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
