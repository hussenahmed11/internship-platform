import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { MessageSquare, Send, Search, Plus, Mail, MailOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id (full_name, email, role),
          recipient:recipient_id (full_name, email, role)
        `)
        .or(`sender_id.eq.${profile!.id},recipient_id.eq.${profile!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Contacts for composing
  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .neq("id", profile!.id)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Mark as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("messages").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages"] }),
  });

  const sendMutation = useMutation({
    mutationFn: async ({ recipient_id, subject, content }: { recipient_id: string; subject: string; content: string }) => {
      const { error } = await supabase.from("messages").insert({
        sender_id: profile!.id,
        recipient_id,
        subject,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast.success("Message sent");
      setComposeOpen(false);
      setNewRecipient("");
      setNewSubject("");
      setNewContent("");
      setReplyContent("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Group messages into conversations by the other party
  const conversations = (() => {
    if (!messages) return [];
    const map = new Map<string, any[]>();
    messages.forEach((m) => {
      const otherId = m.sender_id === profile?.id ? m.recipient_id : m.sender_id;
      if (!map.has(otherId)) map.set(otherId, []);
      map.get(otherId)!.push(m);
    });
    return Array.from(map.entries()).map(([otherId, msgs]) => {
      const latest = msgs[0];
      const other = latest.sender_id === profile?.id ? latest.recipient : latest.sender;
      const unread = msgs.filter(m => m.recipient_id === profile?.id && !m.read).length;
      return { otherId, other, messages: msgs, latest, unread };
    }).filter(c => {
      if (!searchTerm) return true;
      return (c.other as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.latest.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  })();

  const activeConvo = conversations.find(c => c.otherId === selectedThread);

  // Mark messages as read when opening
  useEffect(() => {
    if (activeConvo) {
      activeConvo.messages
        .filter(m => m.recipient_id === profile?.id && !m.read)
        .forEach(m => markReadMutation.mutate(m.id));
    }
  }, [selectedThread]);

  // Realtime subscription
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const handleReply = () => {
    if (!replyContent.trim() || !selectedThread) return;
    sendMutation.mutate({
      recipient_id: selectedThread,
      subject: activeConvo?.latest.subject || "Re:",
      content: replyContent,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1">Communicate with students and coordinators</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3" style={{ minHeight: 500 }}>
        {/* Conversation list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : conversations.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No messages yet</p>
            ) : (
              <ScrollArea className="h-[400px]">
                {conversations.map(c => (
                  <button
                    key={c.otherId}
                    className={`w-full text-left p-4 border-b hover:bg-muted/50 transition-colors ${selectedThread === c.otherId ? "bg-muted" : ""}`}
                    onClick={() => setSelectedThread(c.otherId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {((c.other as any)?.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm truncate">{(c.other as any)?.full_name || "Unknown"}</p>
                          {c.unread > 0 && <Badge className="bg-primary text-primary-foreground text-xs ml-1">{c.unread}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{c.latest.content}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Message thread */}
        <Card className="lg:col-span-2">
          {activeConvo ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {((activeConvo.other as any)?.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{(activeConvo.other as any)?.full_name}</CardTitle>
                    <CardDescription className="capitalize">{(activeConvo.other as any)?.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col" style={{ height: 400 }}>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {[...activeConvo.messages].reverse().map(m => {
                      const isMine = m.sender_id === profile?.id;
                      return (
                        <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] p-3 rounded-lg ${isMine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            {m.subject && <p className="text-xs font-semibold mb-1">{m.subject}</p>}
                            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  />
                  <Button onClick={handleReply} disabled={sendMutation.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full text-muted-foreground" style={{ minHeight: 400 }}>
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Select a conversation or start a new message</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>Send a message to a student or coordinator</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Recipient</Label>
              <Select value={newRecipient} onValueChange={setNewRecipient}>
                <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                <SelectContent>
                  {contacts?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name || c.email} ({c.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input placeholder="Message subject" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea rows={4} placeholder="Write your message..." value={newContent} onChange={(e) => setNewContent(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!newRecipient || !newContent.trim()) { toast.error("Recipient and message are required"); return; }
              sendMutation.mutate({ recipient_id: newRecipient, subject: newSubject, content: newContent });
            }} disabled={sendMutation.isPending}>
              {sendMutation.isPending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
