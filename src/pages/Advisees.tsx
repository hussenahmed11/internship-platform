import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Users, Search, Briefcase, GraduationCap, Mail, MapPin, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Advisees() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: faculty, error: facultyError } = useQuery({
    queryKey: ["advisor-faculty", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: advisees, isLoading, error: adviseeError } = useQuery({
    queryKey: ["advisees-list", faculty?.id],
    enabled: !!faculty?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`*, profiles:profile_id (full_name, email, avatar_url, phone)`)
        .eq("advisor_id", faculty!.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: discoverableStudents, isLoading: loadingDiscover, error: discoverError } = useQuery({
    queryKey: ["discover-students", profile?.department_id],
    enabled: !!profile?.department_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          profiles:profile_id!inner (
            full_name, email, avatar_url, phone, department_id
          )
        `)
        .is("advisor_id", null)
        .eq("profiles.department_id", profile!.department_id);
      
      if (error) throw error;
      return data || [];
    },
  });

  const claimStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from("students")
        .update({ advisor_id: faculty!.id })
        .eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advisees-list"] });
      queryClient.invalidateQueries({ queryKey: ["discover-students"] });
      queryClient.invalidateQueries({ queryKey: ["advisor-advisees"] });
      toast.success("Student successfully claimed as advisee!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const adviseeIds = advisees?.map(a => a.id) ?? [];
  const { data: allApps, isLoading: loadingAllApps, error: appsError } = useQuery({
    queryKey: ["advisees-apps", adviseeIds],
    enabled: adviseeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`id, student_id, status, internship_id, internships:internship_id (title, companies:company_id (company_name))`)
        .in("student_id", adviseeIds);
      if (error) throw error;
      return data;
    },
  });

  const getStatus = (id: string) => {
    const apps = allApps?.filter(a => a.student_id === id) ?? [];
    if (apps.some(a => a.status === "accepted")) return "placed";
    if (apps.some(a => a.status === "interview")) return "interviewing";
    if (apps.some(a => a.status === "applied" || a.status === "waiting")) return "applying";
    return "searching";
  };

  const getProgress = (id: string) => {
    const s = getStatus(id);
    if (s === "placed") return 100;
    if (s === "interviewing") return 65;
    if (s === "applying") return 35;
    return 10;
  };

  const getCompany = (id: string) => {
    const apps = allApps?.filter(a => a.student_id === id) ?? [];
    const a = apps.find(a => a.status === "accepted") ?? apps.find(a => a.status === "interview");
    return a ? (a.internships as any)?.companies?.company_name : null;
  };

  const statusLabels: Record<string, { label: string; class: string }> = {
    placed: { label: "Placed", class: "bg-green-100 text-green-700" },
    interviewing: { label: "Interviewing", class: "bg-blue-100 text-blue-700" },
    applying: { label: "Applying", class: "bg-amber-100 text-amber-700" },
    searching: { label: "Searching", class: "bg-muted text-muted-foreground" },
  };

  const filtered = advisees?.filter(a => {
    const p = a.profiles as any;
    const name = (p?.full_name || "").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || getStatus(a.id) === statusFilter;
    return matchSearch && matchStatus;
  });

  const hasError = facultyError || adviseeError || discoverError || appsError;
  const errorMsg = (facultyError || adviseeError || discoverError || appsError)?.message;

  if (hasError) {
    return (
      <div className="p-8 text-center max-w-2xl mx-auto">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h2 className="text-xl font-bold">Connection Issue</h2>
        <p className="text-muted-foreground mt-2">We couldn't load your students list. This is often due to a temporary database timeout.</p>
        <div className="mt-4 p-4 bg-muted rounded-lg text-left text-xs font-mono overflow-auto max-h-32">
          {errorMsg || "Unknown connection error"}
        </div>
        <Button className="mt-6" onClick={() => queryClient.invalidateQueries()}>Retry Loading</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
        <p className="text-muted-foreground mt-1">Monitor advisees and discover new students in your department</p>
      </div>

      <Tabs defaultValue="my-advisees" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="my-advisees" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> My Advisees
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Discover Students
            {discoverableStudents?.length ? (
              <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">{discoverableStudents.length}</Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-advisees">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="searching">Searching</SelectItem>
                  <SelectItem value="applying">Applying</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="placed">Placed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
            ) : !filtered?.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{advisees?.length ? "No matching students" : "No advisees assigned yet"}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((advisee) => {
                  const p = advisee.profiles as any;
                  const status = getStatus(advisee.id);
                  const progress = getProgress(advisee.id);
                  const company = getCompany(advisee.id);
                  const cfg = statusLabels[status];
                  const appCount = allApps?.filter(a => a.student_id === advisee.id).length ?? 0;

                  return (
                    <Card key={advisee.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-advisor-light text-advisor font-semibold text-lg">
                            {(p?.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{p?.full_name || "Unknown"}</h3>
                              <Badge className={cfg.class}>{cfg.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />{p?.email}
                            </p>
                            {advisee.major && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <GraduationCap className="h-3 w-3" />{advisee.major}
                              </p>
                            )}
                            {company && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Briefcase className="h-3 w-3" />{company}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{appCount} application{appCount !== 1 ? "s" : ""}</span>
                            <span>{progress}% progress</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="discover">
          <Card>
            <CardHeader>
              <CardTitle>Department Students</CardTitle>
              <CardDescription>Unassigned students in the {profile?.departments?.name || "your"} department</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDiscover ? (
                <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : !discoverableStudents?.length ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3 opacity-50" />
                  <p className="text-muted-foreground">All students in your department have been assigned an advisor!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {discoverableStudents.map((student) => {
                    const p = student.profiles as any;
                    return (
                      <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground font-medium">
                            {(p?.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold">{p?.full_name || "New Student"}</p>
                            <p className="text-xs text-muted-foreground uppercase">{student.student_id}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {student.major || "No major"}</span>
                              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email}</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => claimStudentMutation.mutate(student.id)} 
                          disabled={claimStudentMutation.isPending}
                          className="sm:w-32"
                        >
                          {claimStudentMutation.isPending ? "Claiming..." : "Claim Advisee"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
