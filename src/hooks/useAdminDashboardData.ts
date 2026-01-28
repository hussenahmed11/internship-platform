import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminDashboardData() {
    return useQuery({
        queryKey: ["admin-dashboard-stats"],
        queryFn: async () => {
            try {
                // 1. Total Users by Role
                const { data: usersByRole, error: userError } = await supabase
                    .from("profiles")
                    .select("role");
                if (userError) throw userError;

                const totalUsers = usersByRole?.length || 0;
                const roleStats = usersByRole?.reduce((acc, user) => {
                    acc[user.role] = (acc[user.role] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>) || {};

                // 2. Total Departments
                const { count: deptCount, error: deptError } = await supabase
                    .from("departments")
                    .select("*", { count: "exact", head: true });
                if (deptError) throw deptError;

                // 3. Internship Statistics
                const { data: internships, error: internshipError } = await supabase
                    .from("internships")
                    .select("status, created_at");
                if (internshipError) throw internshipError;

                const internshipStats = internships?.reduce((acc, internship) => {
                    acc[internship.status] = (acc[internship.status] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>) || {};

                const activeInternships = internshipStats.active || 0;
                const totalInternships = internships?.length || 0;

                // 4. Application Statistics
                const { data: applications, error: appError } = await supabase
                    .from("applications")
                    .select("status, applied_at");
                if (appError) throw appError;

                const applicationStats = applications?.reduce((acc, app) => {
                    acc[app.status] = (acc[app.status] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>) || {};

                const totalApplications = applications?.length || 0;
                const acceptedApplications = applicationStats.accepted || 0;

                // 5. Recent Activity - Mix of different activities
                const activities = [];

                // Recent user registrations
                const { data: recentUsers, error: recentUsersError } = await supabase
                    .from("profiles")
                    .select("full_name, email, role, created_at")
                    .order("created_at", { ascending: false })
                    .limit(3);
                if (!recentUsersError && recentUsers) {
                    activities.push(...recentUsers.map(user => ({
                        action: "New user registered",
                        details: `${user.full_name || user.email} joined as ${user.role}`,
                        time: new Date(user.created_at).toLocaleDateString(),
                        type: "info" as const
                    })));
                }

                // Recent internship postings
                const { data: recentInternships, error: recentInternshipsError } = await supabase
                    .from("internships")
                    .select("title, created_at, companies(company_name)")
                    .order("created_at", { ascending: false })
                    .limit(2);
                if (!recentInternshipsError && recentInternships) {
                    activities.push(...recentInternships.map(internship => ({
                        action: "New internship posted",
                        details: `${internship.title} by ${internship.companies?.company_name || 'Unknown Company'}`,
                        time: new Date(internship.created_at).toLocaleDateString(),
                        type: "success" as const
                    })));
                }

                // Recent applications
                const { data: recentApplications, error: recentAppsError } = await supabase
                    .from("applications")
                    .select(`
                        status,
                        applied_at,
                        students(profiles(full_name)),
                        internships(title)
                    `)
                    .order("applied_at", { ascending: false })
                    .limit(2);
                if (!recentAppsError && recentApplications) {
                    activities.push(...recentApplications.map(app => ({
                        action: `Application ${app.status}`,
                        details: `${app.students?.profiles?.full_name || 'Student'} applied to ${app.internships?.title || 'Internship'}`,
                        time: new Date(app.applied_at).toLocaleDateString(),
                        type: app.status === 'accepted' ? 'success' as const : 'info' as const
                    })));
                }

                // Recent activity from companies needing verification
                const { data: pendingCompanies, error: pendingError } = await supabase
                    .from("companies")
                    .select("id, company_name, created_at")
                    .eq("verified", false)
                    .limit(3);

                if (!pendingError && pendingCompanies) {
                    activities.push(...pendingCompanies.map(company => ({
                        action: "Company verification requested",
                        details: `${company.company_name} is pending approval`,
                        time: new Date(company.created_at).toLocaleDateString(),
                        type: "warning" as const,
                        id: company.id
                    })));
                }

                // Sort activities by time and limit to 8
                const sortedActivity = activities
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .slice(0, 8);

                // 6. Department Statistics with real data
                const { data: departments, error: deptStatsError } = await supabase
                    .from("departments")
                    .select(`
                        id,
                        name,
                        code
                    `);
                if (deptStatsError) throw deptStatsError;

                const departmentStats = await Promise.all(
                    (departments || []).map(async (dept) => {
                        // Get students in this department
                        const { count: studentCount } = await supabase
                            .from("profiles")
                            .select("*", { count: "exact", head: true })
                            .eq("department_id", dept.id)
                            .eq("role", "student");

                        // Get accepted applications for students in this department
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

                        const students = studentCount || 0;
                        const placements = acceptedApps?.length || 0;
                        const rate = students > 0 ? Math.round((placements / students) * 100) : 0;

                        return {
                            name: dept.name,
                            code: dept.code,
                            students,
                            placements,
                            rate
                        };
                    })
                );

                // 7. Return comprehensive data
                return {
                    stats: {
                        users: totalUsers,
                        departments: deptCount || 0,
                        internships: activeInternships,
                        applications: totalApplications,
                        acceptedApplications,
                        roleStats,
                        internshipStats,
                        applicationStats,
                        pendingVerifications: pendingCompanies?.length || 0
                    },
                    pendingCompanies: pendingCompanies || [],
                    activity: sortedActivity.length > 0 ? sortedActivity : [{
                        action: "System initialized",
                        details: "No recent activity to display",
                        time: new Date().toLocaleDateString(),
                        type: "info" as const
                    }],
                    departmentStats: departmentStats.sort((a, b) => b.rate - a.rate)
                };
            } catch (error) {
                console.error("Error fetching admin dashboard data:", error);
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // 10 minutes
    });
}
