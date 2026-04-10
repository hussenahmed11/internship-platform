import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar as CalendarIcon, Clock, Briefcase, Video, MapPin } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, isAfter, isBefore, addDays } from "date-fns";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ScheduleEvent {
  id: string;
  title: string;
  date: Date;
  type: "interview" | "deadline" | "start";
  details?: string;
  company?: string;
}

export default function Schedule() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Fetch student record
  const { data: student } = useQuery({
    queryKey: ["my-student-schedule", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && profile?.role === "student",
  });

  // Fetch applications with interview dates and internship info
  const { data: applications, isLoading } = useQuery({
    queryKey: ["schedule-applications", student?.id, profile?.id],
    queryFn: async () => {
      if (profile?.role === "student" && student?.id) {
        const { data, error } = await supabase
          .from("applications")
          .select(`
            id, status, interview_date, notes,
            internships:internship_id (
              title, deadline, start_date, location,
              companies:company_id (company_name)
            )
          `)
          .eq("student_id", student.id);
        if (error) throw error;
        return data;
      }
      // For other roles, fetch based on profile
      if (profile?.role === "company") {
        const { data: company } = await supabase
          .from("companies")
          .select("id")
          .eq("profile_id", profile.id)
          .maybeSingle();
        if (!company) return [];
        const { data: internships } = await supabase
          .from("internships")
          .select("id")
          .eq("company_id", company.id);
        if (!internships?.length) return [];
        const { data, error } = await supabase
          .from("applications")
          .select(`
            id, status, interview_date, notes,
            internships:internship_id (
              title, deadline, start_date, location,
              companies:company_id (company_name)
            ),
            students:student_id (
              profiles:profile_id (full_name)
            )
          `)
          .in("internship_id", internships.map(i => i.id))
          .not("interview_date", "is", null);
        if (error) throw error;
        return data;
      }

      if (profile?.role === "advisor") {
        const { data: faculty } = await supabase
          .from("faculty")
          .select("id")
          .eq("profile_id", profile.id)
          .maybeSingle();
        if (!faculty) return [];
        
        const { data: advisees } = await supabase
          .from("students")
          .select("id")
          .eq("advisor_id", faculty.id);
        if (!advisees?.length) return [];
        
        const { data, error } = await supabase
          .from("applications")
          .select(`
            id, status, interview_date, notes,
            internships:internship_id (
              title, deadline, start_date, location,
              companies:company_id (company_name)
            ),
            students:student_id (
              profiles:profile_id (full_name)
            )
          `)
          .in("student_id", advisees.map(s => s.id))
          .not("interview_date", "is", null);
        if (error) throw error;
        return data;
      }
      
      return [];
    },
    enabled: !!profile?.id && (profile?.role !== "student" || !!student?.id),
  });

  // Build events from applications
  const events = useMemo<ScheduleEvent[]>(() => {
    if (!applications) return [];
    const result: ScheduleEvent[] = [];

    for (const app of applications) {
      const internship = app.internships as any;
      const company = internship?.companies?.company_name || "Unknown";
      const studentName = (app as any)?.students?.profiles?.full_name;

      if (app.interview_date) {
        result.push({
          id: `interview-${app.id}`,
          title: studentName
            ? `Interview: ${studentName} for ${internship?.title}`
            : `Interview: ${internship?.title}`,
          date: new Date(app.interview_date),
          type: "interview",
          details: app.notes || internship?.location || undefined,
          company,
        });
      }

      if (internship?.deadline) {
        result.push({
          id: `deadline-${app.id}`,
          title: `Deadline: ${internship?.title}`,
          date: new Date(internship.deadline),
          type: "deadline",
          company,
        });
      }

      if (internship?.start_date && app.status === "accepted") {
        result.push({
          id: `start-${app.id}`,
          title: `Internship Starts: ${internship?.title}`,
          date: new Date(internship.start_date),
          type: "start",
          company,
        });
      }
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [applications]);

  // Events for selected date
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => isSameDay(e.date, selectedDate));
  }, [events, selectedDate]);

  // Upcoming events (next 30 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events.filter(e => isAfter(e.date, now) && isBefore(e.date, addDays(now, 30)));
  }, [events]);

  // Dates that have events (for calendar highlighting)
  const eventDates = useMemo(() => events.map(e => e.date), [events]);

  const typeConfig = {
    interview: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Video, label: "Interview" },
    deadline: { color: "bg-destructive/10 text-destructive", icon: Clock, label: "Deadline" },
    start: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: Briefcase, label: "Start Date" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground mt-1">Your interviews, deadlines, and important dates</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className={cn("p-3 pointer-events-auto")}
              modifiers={{ hasEvent: eventDates }}
              modifiersClassNames={{ hasEvent: "bg-primary/20 font-bold text-primary" }}
            />
          </CardContent>
        </Card>

        {/* Selected day events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
            </CardTitle>
            <CardDescription>
              {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""} on this day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : selectedEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No events on this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map(event => {
                  const config = typeConfig[event.type];
                  const Icon = config.icon;
                  return (
                    <div key={event.id} className="flex gap-4 p-4 rounded-lg border bg-card">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", config.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{event.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span>{format(event.date, "h:mm a")}</span>
                          <span>{event.company}</span>
                          {event.details && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.details}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={config.color}>{config.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming events list */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => {
                const config = typeConfig[event.type];
                const Icon = config.icon;
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDate(event.date)}
                  >
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.company}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{format(event.date, "MMM d")}</p>
                      <p className="text-xs text-muted-foreground">{format(event.date, "h:mm a")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
