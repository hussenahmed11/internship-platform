import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, LogOut, Settings, User, Check, CheckCheck, Trash2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const roleLabels: Record<string, string> = {
  student: "Student",
  company: "Employer",
  advisor: "Academic Advisor",
  coordinator: "Department Coordinator",
  admin: "Administrator",
};

const roleBadgeClasses: Record<string, string> = {
  student: "role-badge-student",
  company: "role-badge-company",
  advisor: "role-badge-advisor",
  coordinator: "role-badge-coordinator",
  admin: "bg-primary/10 text-primary border-primary/20",
};

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: Check,
};

const typeColors: Record<string, string> = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  error: "text-destructive",
  success: "text-green-500",
};

export function DashboardHeader() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-foreground">
              Welcome back, {profile?.full_name?.split(" ")[0] || "User"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {profile?.role && (
            <span
              className={cn(
                "hidden md:inline-flex px-3 py-1 rounded-full text-xs font-medium border",
                roleBadgeClasses[profile.role]
              )}
            >
              {roleLabels[profile.role]}
            </span>
          )}

          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => markAllAsRead.mutate()}
                  >
                    <CheckCheck className="mr-1 h-3 w-3" />
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((n) => {
                      const Icon = typeIcons[n.type] || Info;
                      return (
                        <div
                          key={n.id}
                          className={cn(
                            "flex gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                            !n.read && "bg-primary/5"
                          )}
                          onClick={() => {
                            if (!n.read) markAsRead.mutate(n.id);
                            if (n.action_url) navigate(n.action_url);
                          }}
                        >
                          <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", typeColors[n.type])} />
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm", !n.read && "font-medium")}>{n.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification.mutate(n.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
