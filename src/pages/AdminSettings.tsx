import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Bell, Database, Users, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface SettingsRow {
  id: string;
  key: string;
  value: Record<string, any>;
  updated_at: string;
  updated_by: string | null;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: health, isLoading: healthLoading } = useSystemHealth();

  // Fetch all settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*");
      if (error) throw error;
      const map: Record<string, SettingsRow> = {};
      (data as any[])?.forEach((row: SettingsRow) => {
        map[row.key] = row;
      });
      return map;
    },
  });

  // Fetch active user count
  const { data: userCount } = useQuery({
    queryKey: ["admin-user-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  // Local state for each settings group
  const [general, setGeneral] = useState({
    platform_name: "InternHub",
    support_email: "",
    maintenance_mode: false,
  });
  const [security, setSecurity] = useState({
    two_factor_required: false,
    session_timeout: true,
  });
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    new_user_alerts: true,
  });

  // Sync local state when settings load
  useEffect(() => {
    if (settings?.general) {
      setGeneral({
        platform_name: settings.general.value.platform_name ?? "InternHub",
        support_email: settings.general.value.support_email ?? "",
        maintenance_mode: settings.general.value.maintenance_mode ?? false,
      });
    }
    if (settings?.security) {
      setSecurity({
        two_factor_required: settings.security.value.two_factor_required ?? false,
        session_timeout: settings.security.value.session_timeout ?? true,
      });
    }
    if (settings?.notifications) {
      setNotifications({
        email_notifications: settings.notifications.value.email_notifications ?? true,
        new_user_alerts: settings.notifications.value.new_user_alerts ?? true,
      });
    }
  }, [settings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const { error } = await supabase
        .from("platform_settings")
        .update({ value, updated_by: user?.id ?? null })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success(`${variables.key.charAt(0).toUpperCase() + variables.key.slice(1)} settings saved`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  const getHealthIcon = (status?: string) => {
    if (status === "healthy") return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === "warning") return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    if (status === "error") return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <Skeleton className="h-4 w-4 rounded-full" />;
  };

  const getHealthBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">Loading</Badge>;
    switch (status) {
      case "healthy": return <Badge className="bg-green-600">Healthy</Badge>;
      case "warning": return <Badge className="bg-yellow-500">Warning</Badge>;
      case "error": return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage system configuration and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Database className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure general platform settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={general.platform_name}
                    onChange={(e) => setGeneral({ ...general, platform_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={general.support_email}
                    onChange={(e) => setGeneral({ ...general, support_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable to show maintenance page to users
                  </p>
                </div>
                <Switch
                  checked={general.maintenance_mode}
                  onCheckedChange={(checked) => setGeneral({ ...general, maintenance_mode: checked })}
                />
              </div>
              <Button
                onClick={() => saveMutation.mutate({ key: "general", value: general })}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and access control settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                </div>
                <Switch
                  checked={security.two_factor_required}
                  onCheckedChange={(checked) => setSecurity({ ...security, two_factor_required: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                </div>
                <Switch
                  checked={security.session_timeout}
                  onCheckedChange={(checked) => setSecurity({ ...security, session_timeout: checked })}
                />
              </div>
              <Button
                onClick={() => saveMutation.mutate({ key: "security", value: security })}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save Security Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure system notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email notifications for important events</p>
                </div>
                <Switch
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email_notifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New User Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when new users register</p>
                </div>
                <Switch
                  checked={notifications.new_user_alerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, new_user_alerts: checked })}
                />
              </div>
              <Button
                onClick={() => saveMutation.mutate({ key: "notifications", value: notifications })}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save Notification Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Live system status and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Database</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">PostgreSQL</p>
                    {healthLoading ? (
                      <Skeleton className="h-5 w-16" />
                    ) : (
                      getHealthBadge(health?.database?.status)
                    )}
                  </div>
                  {health?.database?.latency && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Latency: {health.database.latency}ms
                    </p>
                  )}
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Active Users</span>
                  </div>
                  <p className="text-2xl font-bold">{userCount ?? "--"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
                </div>
              </div>

              {/* Service health */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium text-sm">Service Health</h4>
                {healthLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
                  </div>
                ) : (
                  <>
                    {[
                      { label: "Authentication", status: health?.authentication?.status, metric: health?.authentication?.metric },
                      { label: "Applications Engine", status: health?.applications?.status, metric: health?.applications?.metric },
                      { label: "Internships Service", status: health?.internships?.status, metric: health?.internships?.metric },
                    ].map((svc) => (
                      <div key={svc.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getHealthIcon(svc.status)}
                          <span className="text-sm">{svc.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{svc.metric}</span>
                          {getHealthBadge(svc.status)}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
