import { AppRole } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  GraduationCap,
  LayoutDashboard,
  Briefcase,
  FileText,
  MessageSquare,
  Calendar,
  Users,
  Building2,
  Settings,
  HelpCircle,
  ClipboardList,
  BookOpen,
  BarChart3,
  CheckSquare,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

const studentNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Browse Internships", url: "/internships", icon: Briefcase },
  { title: "My Applications", url: "/applications", icon: ClipboardList },
  { title: "Documents", url: "/documents", icon: FolderOpen },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Schedule", url: "/schedule", icon: Calendar },
];

const companyNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Post Internship", url: "/internships/new", icon: Briefcase },
  { title: "My Listings", url: "/listings", icon: FileText },
  { title: "Applications", url: "/applications", icon: ClipboardList },
  { title: "Interviews", url: "/interviews", icon: Calendar },
  { title: "Messages", url: "/messages", icon: MessageSquare },
];

const advisorNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Advisees", url: "/advisees", icon: Users },
  { title: "Approvals", url: "/approvals", icon: CheckSquare },
  { title: "Evaluations", url: "/evaluations", icon: BookOpen },
  { title: "Schedule", url: "/schedule", icon: Calendar },
  { title: "Messages", url: "/messages", icon: MessageSquare },
];

const coordinatorNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Students", url: "/students", icon: Users },
  { title: "Companies", url: "/companies", icon: Building2 },
  { title: "Internships", url: "/internships", icon: Briefcase },
  { title: "Approvals", url: "/approvals", icon: CheckSquare },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Messages", url: "/messages", icon: MessageSquare },
];

const getNavItems = (role: AppRole): NavItem[] => {
  switch (role) {
    case "student":
      return studentNavItems;
    case "company":
      return companyNavItems;
    case "advisor":
      return advisorNavItems;
    case "coordinator":
      return coordinatorNavItems;
    default:
      return studentNavItems;
  }
};

const roleColors: Record<AppRole, string> = {
  student: "from-student to-student-dark",
  company: "from-company to-company-dark",
  advisor: "from-advisor to-advisor-dark",
  coordinator: "from-coordinator to-coordinator-dark",
};

interface DashboardSidebarProps {
  role: AppRole;
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navItems = getNavItems(role);

  return (
    <Sidebar
      className={cn(
        "border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br", roleColors[role])}>
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">InternHub</span>
              <span className="text-xs text-sidebar-foreground/60">Placement System</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-sidebar-foreground/60", collapsed && "sr-only")}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive && "bg-sidebar-accent text-sidebar-primary font-medium"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/help"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
              >
                <HelpCircle className="h-5 w-5" />
                {!collapsed && <span>Help & Support</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
