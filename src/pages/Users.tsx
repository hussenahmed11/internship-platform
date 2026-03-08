import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users as UsersIcon, Plus, Search, MoreHorizontal, Edit, Trash2, AlertCircle, UserCheck, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState } from "react";

interface User {
    id: string;
    user_id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    role: string;
    department_id: string | null;
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
    departments?: {
        name: string;
    } | null;
}

export default function Users() {
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState({
        full_name: "",
        role: "",
        department_id: ""
    });
    const [inviteFormData, setInviteFormData] = useState({
        email: "",
        full_name: "",
        role: "student",
        department_id: ""
    });

    const queryClient = useQueryClient();

    // Fetch users
    const { data: users, isLoading, isError } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select(`
                    *,
                    departments (
                        name
                    )
                `)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as User[];
        }
    });

    // Fetch departments for filters
    const { data: departments } = useQuery({
        queryKey: ["departments-list"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("departments")
                .select("id, name")
                .order("name");
            if (error) throw error;
            return data;
        }
    });

    // Invite user mutation - uses edge function to properly create auth user + profile
    const inviteUserMutation = useMutation({
        mutationFn: async (inviteData: { email: string; full_name: string; role: string; department_id: string; password?: string }) => {
            // Generate a temporary password if not provided
            const password = inviteData.password || `Temp${Math.random().toString(36).slice(-8)}!1`;
            
            const { data, error } = await supabase.functions.invoke("create-user", {
                body: {
                    email: inviteData.email,
                    password: password,
                    full_name: inviteData.full_name,
                    role: inviteData.role,
                    department_id: inviteData.department_id || undefined,
                },
            });

            if (error) throw new Error(error.message);
            if (data?.error) throw new Error(data.error);
            
            return { ...data, tempPassword: password };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(`User created! Temporary password: ${data.tempPassword}`, {
                duration: 10000,
            });
            setIsInviteDialogOpen(false);
            setInviteFormData({
                email: "",
                full_name: "",
                role: "student",
                department_id: ""
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create user");
        }
    });
    const updateUserMutation = useMutation({
        mutationFn: async ({ id, updates }: {
            id: string;
            updates: {
                full_name?: string | null;
                role?: "student" | "company" | "advisor" | "coordinator" | "admin";
                department_id?: string | null;
            }
        }) => {
            const { data, error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User updated successfully!");
            setIsEditDialogOpen(false);
            setEditingUser(null);
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update user");
        }
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            // First check if user has any dependencies
            const { data: studentData } = await supabase
                .from("students")
                .select("id")
                .eq("profile_id", userId)
                .single();

            const { data: companyData } = await supabase
                .from("companies")
                .select("id")
                .eq("profile_id", userId)
                .single();

            if (studentData || companyData) {
                throw new Error("Cannot delete user with existing student or company records");
            }

            const { error } = await supabase
                .from("profiles")
                .delete()
                .eq("id", userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User deleted successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete user");
        }
    });

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin": return <Badge className="bg-primary text-white">Admin</Badge>;
            case "coordinator": return <Badge className="bg-coordinator text-white">Coordinator</Badge>;
            case "advisor": return <Badge className="bg-advisor text-white">Advisor</Badge>;
            case "company": return <Badge className="bg-company text-white">Company</Badge>;
            case "student": return <Badge className="bg-student text-white">Student</Badge>;
            default: return <Badge variant="secondary">{role}</Badge>;
        }
    };

    const getStatusBadge = (user: User) => {
        if (user.role === "company") {
            return getRoleBadge(user.role);
        }
        return (
            <Badge variant={user.onboarding_completed ? "default" : "secondary"}>
                {user.onboarding_completed ? "Active" : "Pending"}
            </Badge>
        );
    };

    const handleInviteUser = () => {
        if (!inviteFormData.email.trim() || !inviteFormData.role) {
            toast.error("Email and role are required");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteFormData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        inviteUserMutation.mutate(inviteFormData);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setEditFormData({
            full_name: user.full_name || "",
            role: user.role,
            department_id: user.department_id || ""
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdateUser = () => {
        if (!editingUser) return;

        updateUserMutation.mutate({
            id: editingUser.id,
            updates: {
                full_name: editFormData.full_name || null,
                role: editFormData.role as "student" | "company" | "advisor" | "coordinator" | "admin",
                department_id: editFormData.department_id || null
            }
        });
    };

    const handleDeleteUser = (userId: string) => {
        deleteUserMutation.mutate(userId);
    };

    // Filter users based on search and filters
    const filteredUsers = users?.filter(user => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesDepartment = departmentFilter === "all" || user.department_id === departmentFilter;

        return matchesSearch && matchesRole && matchesDepartment;
    }) || [];

    // Calculate statistics
    const userStats = users ? {
        total: users.length,
        byRole: users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        onboardingCompleted: users.filter(u => u.onboarding_completed).length,
        recentJoins: users.filter(u => {
            const joinDate = new Date(u.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return joinDate > weekAgo;
        }).length
    } : null;

    return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight text-sidebar-primary">User Management</h1>
                        <p className="text-muted-foreground mt-1">
                            Oversee and manage all platform users and their permissions
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Dialog
                            open={isInviteDialogOpen}
                            onOpenChange={(open) => {
                                setIsInviteDialogOpen(open);
                                if (!open) {
                                    setInviteFormData({
                                        email: "",
                                        full_name: "",
                                        role: "student",
                                        department_id: ""
                                    });
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-sidebar-primary text-white hover:bg-sidebar-primary/90 transition-colors w-full sm:w-auto"
                                    type="button"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Invite User
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Invite New User</DialogTitle>
                                    <DialogDescription>
                                        Send an invitation to a new user to join the platform.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="invite-email">Email Address *</Label>
                                        <Input
                                            id="invite-email"
                                            type="email"
                                            value={inviteFormData.email}
                                            onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                                            placeholder="user@university.edu"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="invite-name">Full Name</Label>
                                        <Input
                                            id="invite-name"
                                            value={inviteFormData.full_name}
                                            onChange={(e) => setInviteFormData({ ...inviteFormData, full_name: e.target.value })}
                                            placeholder="Enter full name (optional)"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="invite-role">Role *</Label>
                                        <Select value={inviteFormData.role} onValueChange={(value) => setInviteFormData({ ...inviteFormData, role: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="student">Student</SelectItem>
                                                <SelectItem value="company">Company</SelectItem>
                                                <SelectItem value="advisor">Advisor</SelectItem>
                                                <SelectItem value="coordinator">Coordinator</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="invite-department">Department</Label>
                                        <Select value={inviteFormData.department_id} onValueChange={(value) => setInviteFormData({ ...inviteFormData, department_id: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select department (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">No Department</SelectItem>
                                                {departments?.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                                            <div className="text-sm text-blue-800">
                                                <p className="font-medium">Note:</p>
                                                <p>The user will need to complete the signup process using this email address to activate their account.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsInviteDialogOpen(false);
                                        }}
                                        disabled={inviteUserMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleInviteUser}
                                        disabled={inviteUserMutation.isPending}
                                    >
                                        {inviteUserMutation.isPending ? "Sending Invitation..." : "Send Invitation"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* User Statistics */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Users
                            </CardTitle>
                            <UsersIcon className="h-5 w-5 text-sidebar-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {isLoading ? <Skeleton className="h-9 w-16" /> : userStats?.total || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {userStats?.recentJoins || 0} joined this week
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Students
                            </CardTitle>
                            <UsersIcon className="h-5 w-5 text-student" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {isLoading ? <Skeleton className="h-9 w-16" /> : userStats?.byRole.student || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Active students</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Companies
                            </CardTitle>
                            <UsersIcon className="h-5 w-5 text-company" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {isLoading ? <Skeleton className="h-9 w-16" /> : userStats?.byRole.company || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Registered companies</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Onboarded
                            </CardTitle>
                            <UserCheck className="h-5 w-5 text-company" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {isLoading ? (
                                    <Skeleton className="h-9 w-16" />
                                ) : (
                                    `${Math.round(((userStats?.onboardingCompleted || 0) / (userStats?.total || 1)) * 100)}%`
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Completed onboarding</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle>Global Directory</CardTitle>
                                <CardDescription>Comprehensive list of everyone registered on InternHub</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="company">Company</SelectItem>
                                        <SelectItem value="advisor">Advisor</SelectItem>
                                        <SelectItem value="coordinator">Coordinator</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments?.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="text-center py-8 text-red-500">
                                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                                <p>Failed to load users. Please check your permissions.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
                                    className="mt-4"
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>{searchTerm || roleFilter !== "all" || departmentFilter !== "all" ? "No users found matching your filters." : "No users found."}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="py-3 px-4 font-medium text-muted-foreground">User</th>
                                            <th className="py-3 px-4 font-medium text-muted-foreground">Role</th>
                                            <th className="py-3 px-4 font-medium text-muted-foreground">Department</th>
                                            <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
                                            <th className="py-3 px-4 font-medium text-muted-foreground">Joined</th>
                                            <th className="py-3 px-4 font-medium text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((usr) => (
                                            <tr key={usr.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border">
                                                            <AvatarImage src={usr.avatar_url || ""} />
                                                            <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-xs">
                                                                {usr.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || usr.email[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">{usr.full_name || "New User"}</span>
                                                            <span className="text-xs text-muted-foreground">{usr.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getRoleBadge(usr.role)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm font-medium">
                                                        {usr.departments?.name || "No Department"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {usr.role === 'company' && (usr as any).companies ? (
                                                        <Badge
                                                            variant={(usr as any).companies.status === 'verified' ? 'default' : (usr as any).companies.status === 'pending' ? 'outline' : 'destructive'}
                                                            className={(usr as any).companies.status === 'verified' ? 'bg-company' : (usr as any).companies.status === 'pending' ? 'border-amber-500 text-amber-600' : ''}
                                                        >
                                                            {(usr as any).companies.status === 'verified' ? 'Verified' : (usr as any).companies.status === 'pending' ? 'Pending' : 'Rejected'}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant={usr.onboarding_completed ? "default" : "secondary"}>
                                                            {usr.onboarding_completed ? "Active" : "Pending"}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                                    {new Date(usr.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleEditUser(usr)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit User
                                                            </DropdownMenuItem>
                                                            {usr.role === "company" && (
                                                                <DropdownMenuItem onClick={() => {
                                                                    const companyId = (usr as any).companies?.id;
                                                                    toast.promise(
                                                                        (async () => {
                                                                            const { error } = await supabase.from('companies').update({ status: 'verified', verified: true }).eq('profile_id', usr.id);
                                                                            if (error) throw error;
                                                                        })(),
                                                                        {
                                                                            loading: 'Verifying company...',
                                                                            success: 'Company verified successfully!',
                                                                            error: 'Failed to verify company'
                                                                        }
                                                                    );
                                                                    queryClient.invalidateQueries({ queryKey: ["users"] });
                                                                }}>
                                                                    <UserCheck className="mr-2 h-4 w-4 text-company" />
                                                                    Verify Company
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem>
                                                                <Mail className="mr-2 h-4 w-4" />
                                                                Send Message
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 focus:text-red-600"
                                                                        onSelect={(e) => e.preventDefault()}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete User
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to delete "{usr.full_name || usr.email}"? This action cannot be undone and will remove all associated data.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDeleteUser(usr.id)}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                            disabled={deleteUserMutation.isPending}
                                                                        >
                                                                            {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>


                {/* Edit User Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                                Update user information and permissions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editFormData.full_name}
                                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-role">Role</Label>
                                <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="company">Company</SelectItem>
                                        <SelectItem value="advisor">Advisor</SelectItem>
                                        <SelectItem value="coordinator">Coordinator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-department">Department</Label>
                                <Select value={editFormData.department_id} onValueChange={(value) => setEditFormData({ ...editFormData, department_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">No Department</SelectItem>
                                        {departments?.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditDialogOpen(false);
                                    setEditingUser(null);
                                }}
                                disabled={updateUserMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateUser}
                                disabled={updateUserMutation.isPending}
                            >
                                {updateUserMutation.isPending ? "Updating..." : "Update User"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
    );
}
