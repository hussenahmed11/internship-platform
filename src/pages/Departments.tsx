import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Plus, Search, MoreVertical, Edit, Trash2, Users, Briefcase, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface DepartmentStats {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  internshipCount: number;
  placementRate: number;
}

export default function Departments() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: ""
    });

    const queryClient = useQueryClient();

    // Fetch departments
    const { data: departments, isLoading, isError } = useQuery({
        queryKey: ["departments"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("departments")
                .select("*")
                .order("name");
            if (error) throw error;
            return data as Department[];
        }
    });

    // Fetch department statistics
    const { data: departmentStats, isLoading: statsLoading } = useQuery({
        queryKey: ["department-stats"],
        queryFn: async () => {
            const { data: depts, error } = await supabase
                .from("departments")
                .select("id, name, code");
            if (error) throw error;

            const stats = await Promise.all(
                depts.map(async (dept) => {
                    // Get student count
                    const { count: studentCount } = await supabase
                        .from("profiles")
                        .select("*", { count: "exact", head: true })
                        .eq("department_id", dept.id)
                        .eq("role", "student");

                    // Get internship count for this department
                    const { count: internshipCount } = await supabase
                        .from("internships")
                        .select("*", { count: "exact", head: true })
                        .eq("department_id", dept.id);

                    // Get placement rate (accepted applications)
                    const { data: acceptedApps } = await supabase
                        .from("applications")
                        .select(`
                            students!inner(
                                profile_id,
                                profiles!inner(department_id)
                            )
                        `)
                        .eq("status", "accepted")
                        .eq("students.profiles.department_id", dept.id);

                    const placements = acceptedApps?.length || 0;
                    const students = studentCount || 0;
                    const placementRate = students > 0 ? Math.round((placements / students) * 100) : 0;

                    return {
                        id: dept.id,
                        name: dept.name,
                        code: dept.code,
                        studentCount: students,
                        internshipCount: internshipCount || 0,
                        placementRate
                    };
                })
            );

            return stats as DepartmentStats[];
        }
    });

    // Add department mutation
    const addDepartmentMutation = useMutation({
        mutationFn: async (newDept: { name: string; code: string; description: string }) => {
            const { data, error } = await supabase
                .from("departments")
                .insert([newDept])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            queryClient.invalidateQueries({ queryKey: ["department-stats"] });
            toast.success("Department added successfully!");
            setIsAddDialogOpen(false);
            setFormData({ name: "", code: "", description: "" });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to add department");
        }
    });

    // Update department mutation
    const updateDepartmentMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Department> }) => {
            const { data, error } = await supabase
                .from("departments")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            queryClient.invalidateQueries({ queryKey: ["department-stats"] });
            toast.success("Department updated successfully!");
            setIsEditDialogOpen(false);
            setEditingDepartment(null);
            setFormData({ name: "", code: "", description: "" });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update department");
        }
    });

    // Delete department mutation
    const deleteDepartmentMutation = useMutation({
        mutationFn: async (id: string) => {
            // Check if department has students or internships
            const { count: studentCount } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("department_id", id);

            const { count: internshipCount } = await supabase
                .from("internships")
                .select("*", { count: "exact", head: true })
                .eq("department_id", id);

            if ((studentCount || 0) > 0 || (internshipCount || 0) > 0) {
                throw new Error("Cannot delete department with existing students or internships");
            }

            const { error } = await supabase
                .from("departments")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            queryClient.invalidateQueries({ queryKey: ["department-stats"] });
            toast.success("Department deleted successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete department");
        }
    });

    const handleAddDepartment = () => {
        if (!formData.name.trim() || !formData.code.trim()) {
            toast.error("Name and code are required");
            return;
        }
        addDepartmentMutation.mutate(formData);
    };

    const handleEditDepartment = (dept: Department) => {
        setEditingDepartment(dept);
        setFormData({
            name: dept.name,
            code: dept.code,
            description: dept.description || ""
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdateDepartment = () => {
        if (!editingDepartment || !formData.name.trim() || !formData.code.trim()) {
            toast.error("Name and code are required");
            return;
        }
        updateDepartmentMutation.mutate({
            id: editingDepartment.id,
            updates: formData
        });
    };

    const handleDeleteDepartment = (id: string) => {
        deleteDepartmentMutation.mutate(id);
    };

    // Filter departments based on search
    const filteredDepartments = departments?.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    // Get stats for a specific department
    const getDepartmentStats = (deptId: string) => {
        return departmentStats?.find(stat => stat.id === deptId);
    };

    return (
        <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-sidebar-primary">Departments</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage university departments and their codes
                        </p>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-coordinator text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Department
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Department</DialogTitle>
                                <DialogDescription>
                                    Create a new department in the system.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Department Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Computer Science"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="code">Department Code</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., CS"
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of the department..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsAddDialogOpen(false)}
                                    disabled={addDepartmentMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddDepartment}
                                    disabled={addDepartmentMutation.isPending}
                                >
                                    {addDepartmentMutation.isPending ? "Adding..." : "Add Department"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Department Statistics Overview */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Departments
                            </CardTitle>
                            <Building2 className="h-5 w-5 text-coordinator" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {isLoading ? <Skeleton className="h-9 w-16" /> : departments?.length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Active departments</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Students
                            </CardTitle>
                            <Users className="h-5 w-5 text-student" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {statsLoading ? (
                                    <Skeleton className="h-9 w-16" />
                                ) : (
                                    departmentStats?.reduce((sum, dept) => sum + dept.studentCount, 0) || 0
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Avg Placement Rate
                            </CardTitle>
                            <TrendingUp className="h-5 w-5 text-company" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {statsLoading ? (
                                    <Skeleton className="h-9 w-16" />
                                ) : (
                                    `${Math.round(
                                        (departmentStats?.reduce((sum, dept) => sum + dept.placementRate, 0) || 0) /
                                        (departmentStats?.length || 1)
                                    )}%`
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Average across departments</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>All Departments</CardTitle>
                                <CardDescription>A list of all registered departments in the system</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search departments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="text-center py-8 text-red-500">
                                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                                <p>Failed to load departments. Please try again.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ["departments"] })}
                                    className="mt-4"
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : filteredDepartments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>{searchTerm ? "No departments found matching your search." : "No departments found."}</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredDepartments.map((dept) => {
                                    const stats = getDepartmentStats(dept.id);
                                    return (
                                        <div
                                            key={dept.id}
                                            className="flex flex-col p-4 rounded-xl border bg-card hover:border-coordinator/50 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-2 rounded-lg bg-coordinator-light/30 group-hover:bg-coordinator-light/50 transition-colors">
                                                    <Building2 className="h-5 w-5 text-coordinator" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {dept.code}
                                                    </Badge>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEditDepartment(dept)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 focus:text-red-600"
                                                                        onSelect={(e) => e.preventDefault()}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Department</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to delete "{dept.name}"? This action cannot be undone.
                                                                            {stats && (stats.studentCount > 0 || stats.internshipCount > 0) && (
                                                                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                                                                                    <AlertCircle className="h-4 w-4 inline mr-1" />
                                                                                    This department has {stats.studentCount} students and {stats.internshipCount} internships.
                                                                                </div>
                                                                            )}
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDeleteDepartment(dept.id)}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                            disabled={deleteDepartmentMutation.isPending}
                                                                        >
                                                                            {deleteDepartmentMutation.isPending ? "Deleting..." : "Delete"}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <h3 className="font-semibold text-lg">{dept.name}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {dept.description || "No description provided."}
                                                </p>
                                            </div>
                                            
                                            {/* Department Statistics */}
                                            {stats && (
                                                <div className="mt-4 pt-4 border-t space-y-2">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            Students
                                                        </span>
                                                        <span className="font-medium">{stats.studentCount}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground flex items-center gap-1">
                                                            <Briefcase className="h-3 w-3" />
                                                            Internships
                                                        </span>
                                                        <span className="font-medium">{stats.internshipCount}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground flex items-center gap-1">
                                                            <TrendingUp className="h-3 w-3" />
                                                            Placement Rate
                                                        </span>
                                                        <Badge
                                                            className={cn(
                                                                stats.placementRate >= 70 ? "bg-company" :
                                                                stats.placementRate >= 40 ? "bg-amber-500" : "bg-red-500"
                                                            )}
                                                        >
                                                            {stats.placementRate}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t">
                                                <span className="text-xs text-muted-foreground">
                                                    Added {new Date(dept.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Department Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Department</DialogTitle>
                            <DialogDescription>
                                Update the department information.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-name">Department Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Computer Science"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-code">Department Code</Label>
                                <Input
                                    id="edit-code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., CS"
                                    maxLength={10}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-description">Description (Optional)</Label>
                                <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the department..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditDialogOpen(false);
                                    setEditingDepartment(null);
                                    setFormData({ name: "", code: "", description: "" });
                                }}
                                disabled={updateDepartmentMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateDepartment}
                                disabled={updateDepartmentMutation.isPending}
                            >
                                {updateDepartmentMutation.isPending ? "Updating..." : "Update Department"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
        </div>
    );
}
