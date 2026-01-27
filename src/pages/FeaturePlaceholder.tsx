import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface FeaturePlaceholderProps {
    title: string;
}

export default function FeaturePlaceholder({ title }: FeaturePlaceholderProps) {
    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in">
                <div className="p-4 bg-amber-100 rounded-full">
                    <Clock className="h-12 w-12 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold">{title} Under Development</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    We are currently building this feature to make it as "real" as the rest of the dashboard.
                    Check back soon for updates!
                </p>
                <Card className="w-full max-w-sm mt-8">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-3/4 animate-pulse" />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">75% Complete</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
