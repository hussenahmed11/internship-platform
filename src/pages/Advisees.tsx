import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Users, Search, Briefcase, GraduationCap, Mail, MapPin } from "lucide-react";

export default function Advisees() {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: faculty } = useQuery({
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

  const { data: advisees, isLoading } = useQuery({
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

  const adviseeIds = advisees?.map(a => a.id) ?? [];
  const { data: allApps } = useQuery({
    queryKey: ["advisees-apps", adviseeIds],
    enabled: adviseeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`*, internships:internship_id (title, companies:company_id (company_name))`)
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Advisees</h1>
        <p className="text-muted-foreground mt-1">Monitor student profiles and placement progress</p>
      </div>

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
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold text-lg">
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
                  {advisee.skills?.length ? (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {advisee.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                      {advisee.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">+{advisee.skills.length - 4}</Badge>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
