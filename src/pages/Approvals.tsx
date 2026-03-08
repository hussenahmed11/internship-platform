import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckSquare, CheckCircle, XCircle, Building2, Briefcase, ClipboardList, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Approvals() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Pending companies (unverified)
  const { data: pendingCompanies, isLoading: loadingCompanies } = useQuery({
    queryKey: ["pending-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*, profiles:profile_id(full_name, email)")
        .eq("verified", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Draft internships (pending approval)
  const { data: draftInternships, isLoading: loadingInternships } = useQuery({
    queryKey: ["draft-internships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select("*, companies(company_name), departments(name)")
        .eq("status", "draft")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Applications needing coordinator approval
  const { data: pendingApplications, isLoading: loadingApps } = useQuery({
    queryKey: ["pending-coord-apps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          students:student_id (
            profile_id, student_id, major,
            profiles:profile_id (full_name, email)
          ),
          internships:internship_id (title, companies(company_name))
        `)
        .is("coordinator_approved", null)
        .in("status", ["applied", "waiting"])
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Company verify mutation
  const verifyCompanyMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase.from("companies").update({ verified }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["pending-companies"] });
      toast.success(vars.verified ? "Company verified" : "Company rejected");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Internship approve mutation
  const approveInternshipMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "closed" }) => {
      const { error } = await supabase.from("internships").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["draft-internships"] });
      toast.success(vars.status === "active" ? "Internship approved and published" : "Internship rejected");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Application coordinator approval
  const approveAppMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase.from("applications").update({ coordinator_approved: approved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["pending-coord-apps"] });
      toast.success(vars.approved ? "Application approved" : "Application rejected");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approvals Center</h1>
        <p className="text-muted-foreground mt-1">Review and approve companies, internships, and applications</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Companies</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingCompanies ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{pendingCompanies?.length ?? 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Draft Internships</CardTitle>
            <Briefcase className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {loadingInternships ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{draftInternships?.length ?? 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Applications</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loadingApps ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{pendingApplications?.length ?? 0}</div>}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">
            Companies {(pendingCompanies?.length ?? 0) > 0 && <Badge variant="destructive" className="ml-1">{pendingCompanies?.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="internships">
            Internships {(draftInternships?.length ?? 0) > 0 && <Badge variant="secondary" className="ml-1">{draftInternships?.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="applications">
            Applications {(pendingApplications?.length ?? 0) > 0 && <Badge variant="secondary" className="ml-1">{pendingApplications?.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Companies Tab */}
        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Company Registrations</CardTitle>
              <CardDescription>Approve or reject new employer registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCompanies ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : (pendingCompanies?.length ?? 0) === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No pending company registrations</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingCompanies?.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.company_name}</TableCell>
                        <TableCell className="text-sm">{c.industry || "—"}</TableCell>
                        <TableCell className="text-sm">{c.location || "—"}</TableCell>
                        <TableCell className="text-sm">{(c.profiles as any)?.email || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => verifyCompanyMutation.mutate({ id: c.id, verified: true })}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => verifyCompanyMutation.mutate({ id: c.id, verified: false })}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Internships Tab */}
        <TabsContent value="internships">
          <Card>
            <CardHeader>
              <CardTitle>Internship Listings</CardTitle>
              <CardDescription>Approve or reject internship postings from employers</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInternships ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : (draftInternships?.length ?? 0) === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No internships pending approval</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Positions</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftInternships?.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.title}</TableCell>
                        <TableCell className="text-sm">{(i.companies as any)?.company_name || "—"}</TableCell>
                        <TableCell className="text-sm">{(i.departments as any)?.name || "General"}</TableCell>
                        <TableCell className="text-sm">{i.positions_available || 1}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => approveInternshipMutation.mutate({ id: i.id, status: "active" })}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => approveInternshipMutation.mutate({ id: i.id, status: "closed" })}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Student Applications</CardTitle>
              <CardDescription>Review and approve student internship applications</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingApps ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : (pendingApplications?.length ?? 0) === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No applications pending coordinator review</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApplications?.map((app) => {
                      const student = app.students as any;
                      const sp = student?.profiles;
                      return (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sp?.full_name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{sp?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{(app.internships as any)?.title}</TableCell>
                          <TableCell className="text-sm">{(app.internships as any)?.companies?.company_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{app.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => approveAppMutation.mutate({ id: app.id, approved: true })}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => approveAppMutation.mutate({ id: app.id, approved: false })}>
                                <XCircle className="h-4 w-4" />
                              </Button>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
