import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  ChevronRight,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  FileText,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";

const stats = [
  { label: "Active Listings", value: "8", change: "3 pending review", icon: Briefcase, color: "text-company" },
  { label: "Total Applications", value: "147", change: "+23 this week", icon: FileText, color: "text-student" },
  { label: "Interviews Scheduled", value: "12", change: "4 today", icon: Calendar, color: "text-coordinator" },
  { label: "Hires This Month", value: "6", change: "+50% from last month", icon: TrendingUp, color: "text-company" },
];

const recentApplications = [
  { name: "Sarah Johnson", position: "Software Engineering Intern", time: "2 hours ago", avatar: "SJ", rating: 4.8 },
  { name: "Michael Chen", position: "Data Science Intern", time: "5 hours ago", avatar: "MC", rating: 4.5 },
  { name: "Emily Davis", position: "Product Design Intern", time: "1 day ago", avatar: "ED", rating: 4.9 },
  { name: "James Wilson", position: "Software Engineering Intern", time: "1 day ago", avatar: "JW", rating: 4.2 },
];

const internshipListings = [
  { title: "Software Engineering Intern", applications: 45, views: 320, status: "active", deadline: "Feb 15, 2026" },
  { title: "Data Science Intern", applications: 32, views: 210, status: "active", deadline: "Feb 20, 2026" },
  { title: "Product Design Intern", applications: 28, views: 180, status: "active", deadline: "Feb 10, 2026" },
  { title: "Marketing Intern", applications: 0, views: 0, status: "draft", deadline: "TBD" },
];

const upcomingInterviews = [
  { candidate: "Sarah Johnson", position: "Software Engineering Intern", time: "10:00 AM", date: "Today" },
  { candidate: "Michael Chen", position: "Data Science Intern", time: "2:00 PM", date: "Today" },
  { candidate: "Emily Davis", position: "Product Design Intern", time: "11:00 AM", date: "Tomorrow" },
];

export function CompanyDashboard() {
  const { profile } = useAuth();
  const isVerified = profile?.company_status === "verified";
  const isPending = profile?.company_status === "pending";
  const isRejected = profile?.company_status === "rejected";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Verification Status Banner */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employer Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your internship listings and track candidates
          </p>
        </div>
        <Button
          className="bg-gradient-company text-white hover:opacity-90"
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
        {/* Internship Listings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Listings</CardTitle>
              <CardDescription>Manage your internship postings</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {internshipListings.map((listing, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{listing.title}</p>
                      <Badge
                        variant={listing.status === "active" ? "default" : "secondary"}
                        className={listing.status === "active" ? "bg-company text-white" : ""}
                      >
                        {listing.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Deadline: {listing.deadline}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {listing.views}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      {listing.applications}
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Interviews */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Interviews</CardTitle>
            <CardDescription>Scheduled interviews for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.map((interview, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-company-light text-company font-semibold text-sm">
                    {interview.candidate.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{interview.candidate}</p>
                    <p className="text-xs text-muted-foreground truncate">{interview.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{interview.time}</p>
                    <p className="text-xs text-muted-foreground">{interview.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
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
          <Button variant="ghost" size="sm">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recentApplications.map((applicant, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-company text-white font-semibold">
                    {applicant.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{applicant.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-muted-foreground">{applicant.rating}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{applicant.position}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {applicant.time}
                  </span>
                  <Button size="sm" variant="outline">
                    Review
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
