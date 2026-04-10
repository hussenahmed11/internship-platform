import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { ClipboardList, Search, UserCheck, CheckCircle2, AlertCircle, Building, User, FileText, CheckSquare, MessageSquare, Briefcase, ChevronRight, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// 17-step mappings defined for UI tracking
const FLOW_STEPS = [
  { id: "user_creation", label: "Admin → User Creation", icon: User },
  { id: "profile_completion", label: "Student → Profile Completion", icon: UserCheck },
  { id: "post_internship", label: "Company → Post Internship", icon: Building },
  { id: "application_submit", label: "System → Application Submission", icon: FileText },
  { id: "coord_approval", label: "Coordinator → Internship Approval", icon: CheckSquare },
  { id: "advisor_approval", label: "Advisor → Student Approval", icon: CheckSquare },
  { id: "interview_schedule", label: "Company → Interview Scheduling", icon: Briefcase },
  { id: "selection", label: "Company → Selection Decision", icon: CheckCircle2 },
  { id: "evaluation", label: "Advisor → Evaluation", icon: ClipboardList },
  { id: "placement", label: "System → Placement Confirmation", icon: GraduationCap },
];

export default function PlacementRecords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const { data: placements, isLoading } = useQuery({
    queryKey: ["all-placements-records"],
    queryFn: async () => {
      // Fetch all applications along with nested relations required for tracking
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          internships:internship_id (
            title, created_at, status,
            companies:company_id (company_name)
          ),
          students:student_id (
            student_id, major,
            profiles:profile_id (full_name, email, onboarding_completed, created_at)
          ),
          evaluations(id)
        `)
        .order("applied_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!placements) return [];
    return placements.filter((p) => {
      const student = p.students as any;
      const internship = p.internships as any;
      const searchMatch = !searchTerm ||
        student?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship?.companies?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "all" || p.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [placements, searchTerm, statusFilter]);

  const getFlowProgress = (app: any) => {
    const student = app.students as any;
    const internship = app.internships as any;
    const evals = app.evaluations as any[];

    // Calculate progression through the steps
    const completion = {
      user_creation: !!student?.profiles?.created_at,
      profile_completion: !!student?.profiles?.onboarding_completed,
      post_internship: !!internship?.created_at,
      application_submit: !!app.applied_at,
      coord_approval: app.coordinator_approved === true,
      advisor_approval: app.advisor_approved === true,
      interview_schedule: !!app.interview_date,
      selection: app.status === "accepted" || app.status === "rejected",
      evaluation: evals && evals.length > 0,
      placement: app.status === "accepted" && app.coordinator_approved === true && (evals && evals.length > 0),
    };

    return completion;
  };

  const getProgressPercentage = (completion: Record<string, boolean>) => {
    const total = Object.keys(completion).length;
    const done = Object.values(completion).filter(Boolean).length;
    return Math.round((done / total) * 100);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-sidebar-primary">Placement Records</h1>
        <p className="text-muted-foreground mt-1">
          Central Dashboard: Track the complete data flow of all internship applications
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by student, company, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="interview">Interviewing</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Master Placement Log</CardTitle>
          <CardDescription>
            {filtered.length} total records across the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No placement records match your query</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>System Status</TableHead>
                  <TableHead>Flow Progress</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((app) => {
                  const student = app.students as any;
                  const int = app.internships as any;
                  const sp = student?.profiles;
                  const comp = int?.companies;
                  const progress = getProgressPercentage(getFlowProgress(app));

                  return (
                    <TableRow key={app.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <p className="font-medium">{sp?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{sp?.email}</p>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-company">{comp?.company_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{int?.title}</TableCell>
                      <TableCell>
                        <Badge variant={app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}
                          className={app.status === 'accepted' ? 'bg-green-600' : ''}>
                          {app.status ? app.status.toUpperCase() : "APPLIED"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-secondary rounded-full h-2.5 max-w-[100px]">
                            <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)}>
                          Trace Flow <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Placement Trace Drawer */}
      <Drawer open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DrawerContent className="h-[85vh]">
          {selectedApp && (
            <div className="mx-auto w-full max-w-2xl overflow-y-auto pb-8">
              <DrawerHeader>
                <DrawerTitle className="text-2xl">Placement Data Flow Trace</DrawerTitle>
                <DrawerDescription>
                  Tracking the system lifecycle for <strong>{(selectedApp?.students as any)?.profiles?.full_name}</strong> at <strong>{(selectedApp?.internships as any)?.companies?.company_name}</strong>
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="p-4">
                <div className="relative border-l-2 border-muted ml-4 pl-6 space-y-8 mt-2">
                  {FLOW_STEPS.map((step, idx) => {
                    const completion = getFlowProgress(selectedApp);
                    const isDone = completion[step.id as keyof typeof completion];
                    const StepIcon = step.icon;
                    return (
                      <div key={idx} className="relative">
                        <div className={cn(
                          "absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-background",
                          isDone ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" : "bg-muted text-muted-foreground"
                        )}>
                          {isDone ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-3 w-3" />}
                        </div>
                        <div className="flex flex-col gap-1">
                          <h4 className={cn("text-sm font-semibold", isDone ? "text-foreground" : "text-muted-foreground")}>
                            {step.label}
                          </h4>
                          {isDone && step.id === "application_submit" && (
                            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md inline-block max-w-fit">
                              Submitted via system on {format(new Date(selectedApp.applied_at), "PPP p")}
                            </p>
                          )}
                          {!isDone && (
                            <p className="text-xs text-muted-foreground opacity-60">
                              Pending action
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
