import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Search, Filter, MapPin, Calendar, Building2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Internships() {
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
        }
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

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-sidebar-primary">Internship Opportunities</h1>
                        <p className="text-muted-foreground mt-1">
                            Active postings, applications, and placement monitoring
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                        <Button className="bg-company text-white">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Post New
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9 bg-background" placeholder="Search internships by title, company, or skills..." />
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-48 w-full rounded-xl" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-red-500 font-medium">
                        Error loading internship data.
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {internships?.map((post) => (
                            <Card key={post.id} className="hover:border-company/50 transition-all cursor-pointer group card-interactive">
                                <CardHeader className="pb-3 border-b bg-muted/10">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
                                                    {post.departments?.code || "GEN"}
                                                </Badge>
                                                {getStatusBadge(post.status)}
                                            </div>
                                            <CardTitle className="text-xl group-hover:text-company transition-colors">
                                                {post.title}
                                            </CardTitle>
                                            <div className="flex items-center text-sm font-medium text-muted-foreground">
                                                <Building2 className="mr-1.5 h-4 w-4" />
                                                {post.companies?.company_name}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {post.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-y-2 py-2">
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <MapPin className="mr-1.5 h-3.5 w-3.5" />
                                            {post.location || post.companies?.location || "Remote"}
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
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
