import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Mail, MessageSquare, Book } from "lucide-react";

export default function Help() {
    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="hover:border-primary transition-all">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Book className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>User Guide</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Read our comprehensive guide on how to use the InternHub platform.</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-primary transition-all">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>FAQ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Find answers to the most frequently asked questions.</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-primary transition-all">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>Contact Support</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Still need help? Reach out to our technical support team.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
