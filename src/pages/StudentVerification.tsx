import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { UserCheck, UserX, AlertCircle, CheckCircle2, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function StudentVerification() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Get faculty record
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

  // Get advisees with verification status
  const { data: students, isLoading } = useQuery({
    queryKey: ["advisees-verification", faculty?.id],
    enabled: !!faculty?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          profiles:profile_id (full_name, email)
        `)
        .eq("advisor_id", faculty!.id);
      if (error) throw error;
      return data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("students")
        .update({ 
          verification_status: status,
          verification_notes: notes 
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advisees-verification"] });
      toast.success("Student status updated");
      setSelectedStudent(null);
      setNotes("");
      setIsRejecting(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive"><UserX className="w-3 h-3 mr-1" /> Correction Needed</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Verification</h1>
        <p className="text-muted-foreground mt-1">Review and verify advisee profile details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Advisees Verification Status</CardTitle>
          <CardDescription>Confirm Student ID and Major details provided during onboarding.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Major</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No advisees found.
                  </TableCell>
                </TableRow>
              ) : (
                students?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{(student.profiles as any)?.full_name}</TableCell>
                    <TableCell>{student.student_id || "Not set"}</TableCell>
                    <TableCell>{student.major || "Not set"}</TableCell>
                    <TableCell>{getStatusBadge(student.verification_status || "pending")}</TableCell>
                    <TableCell className="text-right">
                      {(student.verification_status === "pending" || student.verification_status === "rejected") && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => verifyMutation.mutate({ id: student.id, status: "verified" })}
                          >
                            <UserCheck className="w-4 h-4 mr-1" /> Verify
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-destructive"
                            onClick={() => { setSelectedStudent(student); setIsRejecting(true); }}
                          >
                            <UserX className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                      {student.verification_status === "verified" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-muted-foreground"
                          onClick={() => { setSelectedStudent(student); setIsRejecting(true); }}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={isRejecting} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Correction</DialogTitle>
            <DialogDescription>
              Provide notes on what the student needs to correct (e.g., Wrong Student ID format).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes to Student</label>
              <Textarea 
                placeholder="Details of what needs to be fixed..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejecting(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => verifyMutation.mutate({ id: selectedStudent.id, status: "rejected", notes })}
              disabled={!notes.trim()}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
