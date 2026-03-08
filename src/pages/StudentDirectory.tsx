import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
import { Users, Search, GraduationCap, Mail, Briefcase } from "lucide-react";

export default function StudentDirectory() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Get students with their profiles
  const { data: students, isLoading } = useQuery({
    queryKey: ["directory-students", profile?.department_id],
    queryFn: async () => {
      const query = supabase
        .from("students")
        .select(`
          *,
          profiles:profile_id (
            full_name, email, phone, department_id, avatar_url,
            departments:department_id (name)
          )
        `)
        .order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Get applications for placement status
  const { data: applications } = useQuery({
    queryKey: ["directory-apps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("student_id, status, internships:internship_id(title, companies(company_name))");
      if (error) throw error;
      return data;
    },
  });

  const getPlacementStatus = (studentId: string) => {
    const apps = applications?.filter(a => a.student_id === studentId) ?? [];
    if (apps.some(a => a.status === "accepted")) return "placed";
    if (apps.some(a => a.status === "interview")) return "interviewing";
    if (apps.some(a => a.status === "applied" || a.status === "waiting")) return "applying";
    return "searching";
  };

  const getLatestPlacement = (studentId: string) => {
    const accepted = applications?.find(a => a.student_id === studentId && a.status === "accepted");
    if (accepted) {
      return `${(accepted.internships as any)?.title} @ ${(accepted.internships as any)?.companies?.company_name}`;
    }
    return null;
  };

  const filtered = useMemo(() => {
    if (!students) return [];
    return students.filter(s => {
      const sp = s.profiles as any;
      const matchSearch = !searchTerm ||
        sp?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.major?.toLowerCase().includes(searchTerm.toLowerCase());
      const status = getPlacementStatus(s.id);
      const matchStatus = statusFilter === "all" || status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [students, applications, searchTerm, statusFilter]);

  const stats = {
    total: students?.length ?? 0,
    placed: students?.filter(s => getPlacementStatus(s.id) === "placed").length ?? 0,
    interviewing: students?.filter(s => getPlacementStatus(s.id) === "interviewing").length ?? 0,
    searching: students?.filter(s => getPlacementStatus(s.id) === "searching").length ?? 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "placed": return <Badge className="bg-green-600 text-white">Placed</Badge>;
      case "interviewing": return <Badge className="bg-amber-600 text-white">Interviewing</Badge>;
      case "applying": return <Badge className="bg-blue-600 text-white">Applying</Badge>;
      default: return <Badge variant="secondary">Searching</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
        <p className="text-muted-foreground mt-1">Track student internship participation and placement progress</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats.total}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Placed</CardTitle>
            <Briefcase className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats.placed}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Interviewing</CardTitle>
            <GraduationCap className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats.interviewing}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Searching</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats.searching}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, email, ID, or major..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="placed">Placed</SelectItem>
            <SelectItem value="interviewing">Interviewing</SelectItem>
            <SelectItem value="applying">Applying</SelectItem>
            <SelectItem value="searching">Searching</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Students</CardTitle>
          </div>
          <CardDescription>{filtered.length} students</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No students found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Major</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Placement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const sp = s.profiles as any;
                  const status = getPlacementStatus(s.id);
                  const placement = getLatestPlacement(s.id);
                  return (
                    <TableRow key={s.id}>
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
                      <TableCell className="text-sm font-mono">{s.student_id}</TableCell>
                      <TableCell className="text-sm">{s.major || "—"}</TableCell>
                      <TableCell className="text-sm">{s.gpa ? Number(s.gpa).toFixed(2) : "—"}</TableCell>
                      <TableCell className="text-sm">{sp?.departments?.name || "—"}</TableCell>
                      <TableCell>{getStatusBadge(status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {placement || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
