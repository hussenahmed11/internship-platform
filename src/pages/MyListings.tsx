import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Briefcase, Plus, Search, MoreVertical, Trash2, Eye, FileText, MapPin, Calendar } from "lucide-react";

export default function MyListings() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: company } = useQuery({
    queryKey: ["my-company"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("profile_id", profile!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: internships, isLoading } = useQuery({
    queryKey: ["my-internships", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select("*, departments(name, code)")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  // Get application counts per internship
  const { data: appCounts } = useQuery({
    queryKey: ["listing-app-counts", company?.id],
    queryFn: async () => {
      if (!internships || internships.length === 0) return {};
      const ids = internships.map(i => i.id);
      const { data, error } = await supabase
        .from("applications")
        .select("internship_id")
        .in("internship_id", ids);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((a) => { counts[a.internship_id] = (counts[a.internship_id] || 0) + 1; });
      return counts;
    },
    enabled: !!internships && internships.length > 0,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("internships").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-internships"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("internships").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-internships"] });
      toast.success("Listing deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!internships) return [];
    return internships.filter(i => {
      const matchSearch = !searchTerm || i.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [internships, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-600 text-white">Active</Badge>;
      case "draft": return <Badge variant="outline">Draft</Badge>;
      case "closed": return <Badge variant="secondary">Closed</Badge>;
      case "filled": return <Badge className="bg-blue-600 text-white">Filled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Listings</h1>
          <p className="text-muted-foreground mt-1">Manage your internship postings</p>
        </div>
        <Button onClick={() => navigate("/internships/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Post New
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search listings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle>Internship Listings</CardTitle>
          </div>
          <CardDescription>{filtered.length} listings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No listings found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">{(listing.departments as any)?.name || "General"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(listing.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {appCounts?.[listing.id] || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {listing.remote ? "Remote" : listing.location || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {listing.deadline ? new Date(listing.deadline).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate("/applications")}>
                              <Eye className="mr-2 h-4 w-4" /> View Applications
                            </DropdownMenuItem>
                            {(["draft", "active", "closed", "filled"] as const).filter(s => s !== listing.status).map(s => (
                              <DropdownMenuItem key={s} onClick={() => updateStatusMutation.mutate({ id: listing.id, status: s })}>
                                Set as {s.charAt(0).toUpperCase() + s.slice(1)}
                              </DropdownMenuItem>
                            ))}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete "{listing.title}"?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(listing.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
