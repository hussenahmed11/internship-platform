import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Users, Briefcase, CheckCircle2, AlertCircle, Calendar, Clock, Target, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart
} from "recharts";
import { useState } from "react";

const COLORS = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899"];

export default function Analytics() {
    const [timeRange, setTimeRange] = useState("30");

    const { data: analytics, isLoading, isError } = useQuery({
        queryKey: ["platform-analytics", timeRange],
        queryFn: async () => {
            try {
                // Calculate date range
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - parseInt(timeRange));

                // 1. Application status distribution
                const { data: apps, error: appsError } = await supabase
                    .from("applications")
                    .select("status, applied_at")
                    .gte("applied_at", startDate.toISOString());
                if (appsError) throw appsError;

                const statusMap = apps.reduce((acc: any, curr) => {
                    const s = curr.status || "applied";
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {});

                const pieData = Object.entries(statusMap).map(([name, value]) => ({ 
                    name: name.charAt(0).toUpperCase() + name.slice(1), 
                    value 
                }));

                // 2. Department placement rates
                const { data: depts, error: deptsError } = await supabase
                    .from("departments")
                    .select("id, name, code");
                if (deptsError) throw deptsError;

                const barData = await Promise.all(
                    depts.map(async (dept) => {
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
                        const placed = acceptedApps?.length || 0;
                        const rate = students > 0 ? Math.round((placed / students) * 100) : 0;

                        return {
                            name: dept.name.length > 12 ? dept.name.substring(0, 12) + "..." : dept.name,
                            code: dept.code,
                            total: students,
                            placed: placed,
                            rate: rate
                        };
                    })
                );

                // 3. Application trends over time
                const trendData = [];
                for (let i = parseInt(timeRange); i >= 0; i -= Math.max(1, Math.floor(parseInt(timeRange) / 10))) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    
                    const dayApps = apps.filter(app => {
                        const appDate = new Date(app.applied_at);
                        return appDate.toDateString() === date.toDateString();
                    });

                    trendData.push({
                        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        applications: dayApps.length,
                        accepted: dayApps.filter(app => app.status === 'accepted').length
                    });
                }

                // 4. Key metrics
                const totalApplications = apps.length;
                const acceptedApplications = apps.filter(app => app.status === 'accepted').length;
                const interviewApplications = apps.filter(app => app.status === 'interview').length;
                const placementRate = totalApplications > 0 ? Math.round((acceptedApplications / totalApplications) * 100) : 0;
                const interviewRate = totalApplications > 0 ? Math.round((interviewApplications / totalApplications) * 100) : 0;

                // 5. Recent activity metrics
                const recentApps = apps.filter(app => {
                    const appDate = new Date(app.applied_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return appDate > weekAgo;
                });

                // 6. Get internship statistics
                const { data: internships, error: internshipsError } = await supabase
                    .from("internships")
                    .select("status, created_at")
                    .gte("created_at", startDate.toISOString());
                if (internshipsError) throw internshipsError;

                const activeInternships = internships.filter(i => i.status === 'active').length;
                const totalInternships = internships.length;

                // 7. User growth
                const { data: users, error: usersError } = await supabase
                    .from("profiles")
                    .select("role, created_at")
                    .gte("created_at", startDate.toISOString());
                if (usersError) throw usersError;

                const userGrowth = users.reduce((acc: any, user) => {
                    acc[user.role] = (acc[user.role] || 0) + 1;
                    return acc;
                }, {});

                return {
                    pieData,
                    barData: barData.sort((a, b) => b.rate - a.rate),
                    trendData,
                    metrics: {
                        totalApplications,
                        acceptedApplications,
                        placementRate,
                        interviewRate,
                        recentApplications: recentApps.length,
                        activeInternships,
                        totalInternships,
                        userGrowth
                    }
                };
            } catch (error) {
                console.error("Analytics error:", error);
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // 10 minutes
    });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'accepted': return '#10B981';
            case 'interview': return '#F59E0B';
            case 'waiting': return '#3B82F6';
            case 'rejected': return '#EF4444';
            default: return '#8B5CF6';
        }
    };

    return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-sidebar-primary">Performance Analytics</h1>
                        <p className="text-muted-foreground mt-1">
                            Real-time insights into system health and placement trends
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                                <SelectItem value="365">Last year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="card-interactive">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Placement Rate</CardTitle>
                            <Target className="h-4 w-4 text-company" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {isLoading ? <Skeleton className="h-9 w-16" /> : `${analytics?.metrics.placementRate || 0}%`}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {analytics?.metrics.acceptedApplications || 0} of {analytics?.metrics.totalApplications || 0} applications
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="card-interactive">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
                            <Users className="h-4 w-4 text-student" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {isLoading ? <Skeleton className="h-9 w-16" /> : `${analytics?.metrics.interviewRate || 0}%`}
                            </div>
                            <p className="text-xs text-muted-foreground">Applications reaching interview stage</p>
                        </CardContent>
                    </Card>
                    <Card className="card-interactive">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Active Internships</CardTitle>
                            <Briefcase className="h-4 w-4 text-coordinator" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {isLoading ? <Skeleton className="h-9 w-16" /> : analytics?.metrics.activeInternships || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {analytics?.metrics.totalInternships || 0} total posted
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="card-interactive">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                            <Clock className="h-4 w-4 text-advisor" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {isLoading ? <Skeleton className="h-9 w-16" /> : analytics?.metrics.recentApplications || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Applications this week</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Application Trends */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Application Trends</CardTitle>
                            <CardDescription>Daily application volume and acceptance rate</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {isLoading ? (
                                <Skeleton className="h-full w-full" />
                            ) : isError ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <AlertCircle className="h-8 w-8 mr-2" />
                                    Failed to load trend data
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics?.trendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" fontSize={12} />
                                        <YAxis fontSize={12} />
                                        <Tooltip />
                                        <Area 
                                            type="monotone" 
                                            dataKey="applications" 
                                            stackId="1"
                                            stroke="#8B5CF6" 
                                            fill="#8B5CF6" 
                                            fillOpacity={0.6}
                                            name="Applications"
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="accepted" 
                                            stackId="2"
                                            stroke="#10B981" 
                                            fill="#10B981" 
                                            fillOpacity={0.8}
                                            name="Accepted"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Status Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Application Pipeline</CardTitle>
                            <CardDescription>Distribution of application statuses</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {isLoading ? (
                                <Skeleton className="h-full w-full" />
                            ) : isError ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <AlertCircle className="h-8 w-8 mr-2" />
                                    Failed to load status data
                                </div>
                            ) : (
                                <div className="flex h-full">
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={analytics?.pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {analytics?.pieData.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={getStatusColor(entry.name)} 
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-col justify-center space-y-2 ml-4">
                                        {analytics?.pieData.map((entry, index) => (
                                            <div key={String(entry.name)} className="flex items-center gap-2">
                                                <div 
                                                    className="w-3 h-3 rounded-full" 
                                                    style={{ backgroundColor: getStatusColor(String(entry.name)) }}
                                                />
                                                <span className="text-sm font-medium">{String(entry.name)}</span>
                                                <Badge variant="outline">{String(entry.value)}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Department Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Department Performance</CardTitle>
                        <CardDescription>Placement rates and student distribution by department</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        {isLoading ? (
                            <Skeleton className="h-full w-full" />
                        ) : isError ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mr-2" />
                                Failed to load department data
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics?.barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={12} />
                                    <YAxis fontSize={12} />
                                    <Tooltip 
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                        <p className="font-medium">{label} ({data.code})</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Total Students: {data.total}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Placed: {data.placed}
                                                        </p>
                                                        <p className="text-sm font-medium text-company">
                                                            Placement Rate: {data.rate}%
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="total" fill="#e2e8f0" name="Total Students" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="placed" fill="#8B5CF6" name="Placed Students" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* User Growth */}
                {analytics?.metrics.userGrowth && Object.keys(analytics.metrics.userGrowth).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>User Growth</CardTitle>
                            <CardDescription>New user registrations by role in the selected period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                {Object.entries(analytics.metrics.userGrowth).map(([role, count]) => (
                                    <div key={role} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <p className="text-sm font-medium capitalize">{role}s</p>
                                            <p className="text-xs text-muted-foreground">New registrations</p>
                                        </div>
                                        <div className="text-2xl font-bold">{count as number}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
    );
}
