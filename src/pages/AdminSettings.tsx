import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Bell, Globe, Database, Save } from "lucide-react";

export default function AdminSettings() {
    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-sidebar-primary">System Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Global configuration and platform maintenance
                    </p>
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4">
                        <TabsTrigger value="general" className="gap-2">
                            <Globe className="h-4 w-4" />
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
                        <TabsTrigger value="maintenance" className="gap-2">
                            <Database className="h-4 w-4" />
                            Maintenance
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Configuration</CardTitle>
                                <CardDescription>Update your institution's branding and global settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="inst-name">Institution Name</Label>
                                        <Input id="inst-name" defaultValue="Haramaya University" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="platform-url">Platform URL</Label>
                                        <Input id="platform-url" defaultValue="https://internhub.edu" />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Public Registration</Label>
                                            <p className="text-xs text-muted-foreground">Allow new users to sign up without invitations</p>
                                        </div>
                                        <Switch />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Auto-Verify Companies</Label>
                                            <p className="text-xs text-muted-foreground">Automatically approve verified domains</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button className="bg-admin hover:opacity-90">
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>Global Security Policy</CardTitle>
                                <CardDescription>Authentication and access control rules</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Two-Factor Authentication (Required)</Label>
                                            <p className="text-xs text-muted-foreground">Enforce 2FA for all administrative roles</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>API Access</Label>
                                            <p className="text-xs text-muted-foreground">Enable external API integrations</p>
                                        </div>
                                        <Switch />
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full">Manage Permission Groups</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="maintenance">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                                <CardDescription>Critical system operations and resets</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg border border-red-200 bg-red-50 space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-red-600">Clear System Cache</p>
                                            <p className="text-xs text-red-500">Force refresh all session tokens and cache</p>
                                        </div>
                                        <Button variant="destructive" size="sm">Clear</Button>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-red-200">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-red-600">Database Purge</p>
                                            <p className="text-xs text-red-500">Permanently delete all logs older than 1 year</p>
                                        </div>
                                        <Button variant="destructive" size="sm">Purge</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
