import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Search, Filter, MapPin, Calendar, Building2, Clock, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useMemo } from "react";

export default function Internships() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const canManage = profile?.role === "admin" || profile?.role === "coordinator";
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: internships, isLoading, isError } = useQuery({
    queryKey: ["all-internships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select(`
          *,
          companies (
            company_name,
            location
          ),
          departments (
            name,
            code
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Filter internships
  const filteredInternships = useMemo(() => {
    if (!internships) return [];
    return internships.filter((post) => {
      const matchesSearch =
        !searchTerm ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.companies as any)?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.skills_required?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [internships, searchTerm, statusFilter]);

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "active" | "closed" | "filled" }) => {
      const { error } = await supabase
        .from("internships")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-internships"] });
      toast.success("Internship status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check for applications first
      const { count } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("internship_id", id);
      if ((count || 0) > 0) {
        throw new Error("Cannot delete internship with existing applications");
      }
      const { error } = await supabase.from("internships").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-internships"] });
      toast.success("Internship deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete internship");
    },
  });

  const isStudent = profile?.role === "student";

  // Fetch student record if they are a student
  const { data: student } = useQuery({
    queryKey: ["my-student", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && isStudent,
  });

  // Fetch my applications to check status
  const { data: myApplications } = useQuery({
    queryKey: ["my-applications", student?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("internship_id")
        .eq("student_id", student!.id);
      if (error) throw error;
      return data.map(a => a.internship_id);
    },
    enabled: !!student?.id && isStudent,
  });

  // Apply mutation
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const applyMutation = useMutation({
    mutationFn: async (internshipId: string) => {
      if (!student?.id) throw new Error("Student profile not found");
      const { error } = await supabase
        .from("applications")
        .insert({
          student_id: student.id,
          internship_id: internshipId,
          status: "applied"
        });
      if (error) throw error;
    },
    onMutate: (id) => setApplyingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success("Successfully applied for internship!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to apply");
    },
    onSettled: () => setApplyingId(null),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-company text-white">Active</Badge>;
      case "closed": return <Badge variant="secondary">Closed</Badge>;
      case "filled": return <Badge className="bg-student text-white">Filled</Badge>;
      case "draft": return <Badge variant="outline">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusOptions: Array<"draft" | "active" | "closed" | "filled"> = ["draft", "active", "closed", "filled"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-sidebar-primary">Internship Opportunities</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Manage all internship postings" : "Active postings, applications, and placement monitoring"}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-background"
            placeholder="Search internships by title, company, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-12 text-center text-destructive font-medium">
          Error loading internship data.
        </div>
      ) : filteredInternships.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No internships found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredInternships.map((post) => (
            <Card key={post.id} className="hover:border-company/50 transition-all group card-interactive">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
                        {(post.departments as any)?.code || "GEN"}
                      </Badge>
                      {getStatusBadge(post.status)}
                    </div>
                    <CardTitle className="text-xl group-hover:text-company transition-colors">
                      {post.title}
                    </CardTitle>
                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                      <Building2 className="mr-1.5 h-4 w-4" />
                      {(post.companies as any)?.company_name}
                    </div>
                  </div>
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {statusOptions
                          .filter((s) => s !== post.status)
                          .map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => updateStatusMutation.mutate({ id: post.id, status: s })}
                            >
                              Set as {s.charAt(0).toUpperCase() + s.slice(1)}
                            </DropdownMenuItem>
                          ))}
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{post.title}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. Internships with applications cannot be deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(post.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {post.description}
                </p>

                <div className="grid grid-cols-2 gap-y-2 py-2">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="mr-1.5 h-3.5 w-3.5" />
                    {post.location || (post.companies as any)?.location || "Remote"}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                    {post.duration || "N/A"}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground col-span-2">
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    Deadline: {post.deadline ? new Date(post.deadline).toLocaleDateString() : "Flexible"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {post.skills_required?.slice(0, 4).map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="text-[10px] bg-sidebar-primary/5 text-sidebar-primary border-none">
                      {skill}
                    </Badge>
                  ))}
                  {post.skills_required?.length > 4 && (
                    <Badge variant="secondary" className="text-[10px]">
                      +{post.skills_required.length - 4} more
                    </Badge>
                  )}
                </div>

                {isStudent && (
                  <div className="pt-4 border-t mt-4">
                    <Button 
                      className="w-full" 
                      disabled={myApplications?.includes(post.id) || post.status !== "active" || applyMutation.isPending}
                      onClick={() => applyMutation.mutate(post.id)}
                    >
                      {myApplications?.includes(post.id) ? (
                        "Applied"
                      ) : post.status !== "active" ? (
                        "Not Accepting Applications"
                      ) : applyingId === post.id ? (
                        "Applying..."
                      ) : (
                        "Apply Now"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
