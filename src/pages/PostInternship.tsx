import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { Briefcase, X } from "lucide-react";

export default function PostInternship() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    duration: "",
    stipend: "",
    deadline: "",
    start_date: "",
    end_date: "",
    positions_available: 1,
    remote: false,
    department_id: "",
    skills_required: [] as string[],
    requirements: [] as string[],
  });
  const [reqInput, setReqInput] = useState("");

  const { data: company } = useQuery({
    queryKey: ["my-company"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!company) throw new Error("Company not found");
      const { error } = await supabase.from("internships").insert({
        company_id: company.id,
        title: form.title,
        description: form.description,
        location: form.location || null,
        duration: form.duration || null,
        stipend: form.stipend || null,
        deadline: form.deadline || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        positions_available: form.positions_available,
        remote: form.remote,
        department_id: form.department_id || null,
        skills_required: form.skills_required.length > 0 ? form.skills_required : null,
        requirements: form.requirements.length > 0 ? form.requirements : null,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Internship posted! It will be reviewed before going live.");
      navigate("/listings");
    },
    onError: (e: any) => toast.error(e.message || "Failed to post internship"),
  });

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills_required.includes(s)) {
      setForm((f) => ({ ...f, skills_required: [...f.skills_required, s] }));
      setSkillInput("");
    }
  };

  const addReq = () => {
    const r = reqInput.trim();
    if (r && !form.requirements.includes(r)) {
      setForm((f) => ({ ...f, requirements: [...f.requirements, r] }));
      setReqInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Post New Internship</h1>
        <p className="text-muted-foreground mt-1">Create a new internship listing for students to apply</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle>Internship Details</CardTitle>
            </div>
            <CardDescription>Fill in the details for your internship opportunity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" placeholder="e.g. Software Engineering Intern" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="desc">Description *</Label>
                <Textarea id="desc" rows={5} placeholder="Describe the role, responsibilities, and what the intern will learn..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label>Department</Label>
                <Select value={form.department_id} onValueChange={(v) => setForm(f => ({ ...f, department_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g. Addis Ababa" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.remote} onCheckedChange={(v) => setForm(f => ({ ...f, remote: v }))} />
                <Label>Remote position</Label>
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input id="duration" placeholder="e.g. 3 months" value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="stipend">Stipend</Label>
                <Input id="stipend" placeholder="e.g. 5000 ETB/month" value={form.stipend} onChange={(e) => setForm(f => ({ ...f, stipend: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="positions">Positions Available</Label>
                <Input id="positions" type="number" min={1} value={form.positions_available} onChange={(e) => setForm(f => ({ ...f, positions_available: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="start">Start Date</Label>
                <Input id="start" type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="end">End Date</Label>
                <Input id="end" type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>

            {/* Skills */}
            <div>
              <Label>Required Skills</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="Add a skill" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.skills_required.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setForm(f => ({ ...f, skills_required: f.skills_required.filter(x => x !== s) }))} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <Label>Requirements</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="Add a requirement" value={reqInput} onChange={(e) => setReqInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addReq(); } }} />
                <Button type="button" variant="outline" onClick={addReq}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.requirements.map((r) => (
                  <Badge key={r} variant="secondary" className="gap-1">
                    {r}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setForm(f => ({ ...f, requirements: f.requirements.filter(x => x !== r) }))} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Posting..." : "Post Internship"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
