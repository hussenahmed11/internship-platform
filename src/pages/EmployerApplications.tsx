import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { ClipboardList, Search, Eye, CheckCircle, XCircle, Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function EmployerApplications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: company } = useQuery({
    queryKey: ["my-company"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("profile_id", profile!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: internships } = useQuery({
    queryKey: ["my-internships", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("internships").select("id, title").eq("company_id", company!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  const { data: applications, isLoading } = useQuery({
    queryKey: ["employer-applications", company?.id],
    queryFn: async () => {
      if (!internships || internships.length === 0) return [];
      const ids = internships.map(i => i.id);
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          students:student_id (
            id, profile_id, student_id, major, gpa, skills,
            profiles:profile_id (full_name, email, avatar_url, phone)
          ),
          internships:internship_id (title)
        `)
        .in("internship_id", ids)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!internships && internships.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("applications").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-applications"] });
      toast.success("Application updated");
      setInterviewOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!applications) return [];
    return applications.filter(a => {
      const student = a.students as any;
      const name = student?.profiles?.full_name || "";
      const matchSearch = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase()) || (a.internships as any)?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: any; className?: string; label: string }> = {
      applied: { variant: "outline", label: "Applied" },
      interview: { variant: "default", className: "bg-amber-600 text-white", label: "Interview" },
      waiting: { variant: "secondary", label: "Waiting" },
      accepted: { variant: "default", className: "bg-green-600 text-white", label: "Accepted" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const s = map[status] || { variant: "outline", label: status };
    return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
  };

  const handleScheduleInterview = (app: any) => {
    setSelectedApp(app);
    setInterviewDate(app.interview_date ? app.interview_date.slice(0, 16) : "");
    setNotes(app.notes || "");
    setInterviewOpen(true);
  };

  const submitInterview = () => {
    if (!selectedApp || !interviewDate) {
      toast.error("Please select a date and time");
      return;
    }
    updateMutation.mutate({
      id: selectedApp.id,
      updates: {
        status: "interview",
        interview_date: new Date(interviewDate).toISOString(),
        notes,
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground mt-1">Review and manage candidates who applied to your internships</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or position..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle>All Applications</CardTitle>
          </div>
          <CardDescription>{filtered.length} applications</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No applications found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((app) => {
                  const student = app.students as any;
                  const sp = student?.profiles;
                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {(sp?.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium">{sp?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{sp?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{(app.internships as any)?.title}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-sm">{student?.gpa ? student.gpa.toFixed(2) : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Schedule Interview" onClick={() => handleScheduleInterview(app)}>
                            <Calendar className="h-4 w-4" />
                          </Button>
                          {app.status !== "accepted" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" title="Accept" onClick={() => updateMutation.mutate({ id: app.id, updates: { status: "accepted" } })}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {app.status !== "rejected" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Reject" onClick={() => updateMutation.mutate({ id: app.id, updates: { status: "rejected" } })}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Schedule Interview Dialog */}
      <Dialog open={interviewOpen} onOpenChange={setInterviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              {selectedApp && `Schedule interview with ${(selectedApp.students as any)?.profiles?.full_name || "candidate"}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Interview Date & Time</Label>
              <Input type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Meeting link, location, instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterviewOpen(false)}>Cancel</Button>
            <Button onClick={submitInterview} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Scheduling..." : "Schedule Interview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
