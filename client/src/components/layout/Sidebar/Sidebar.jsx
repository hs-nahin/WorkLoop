import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BarChart3,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
} from "lucide-react";
import { useContext, useState } from "react";
import { Link, useLocation } from "react-router";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { AppContext } from "../../../context/AppContext.jsx";
import { AuthContext } from "../../../context/AuthContextInstance.js";
import { cn } from "../../../lib/utils";
import { hasPermission } from "../../../lib/permissions";

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useContext(AppContext);
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["PROFILE_VIEW"] },
  { name: "Tasks", path: "/tasks", icon: CheckSquare, roles: ["COMMENT_CREATE"] },
  { name: "Completed", path: "/completed", icon: CheckCircle2, roles: ["COMMENT_CREATE"] },
  { name: "Performance", path: "/performance", icon: BarChart3, roles: ["PERFORMANCE_VIEW"] },
  { name: "Announcements", path: "/announcements", icon: Megaphone, roles: ["DASHBOARD_ADMIN"] },
  { name: "Announcement History", path: "/announcements/history", icon: History, roles: ["PROFILE_VIEW"] },
  { name: "Audit Logs", path: "/audit-logs", icon: History, roles: ["AUDIT_LOG_VIEW"] },
];

  const filteredItems = menuItems.filter(item => item.roles.some(r => hasPermission(user?.role, r)));

  const content = (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-8 flex items-center justify-between">
        {/* WorkLoop Brand Logo and Name */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm group-hover:scale-110 transition-transform shadow-sm">
            WL
          </div>
          {sidebarOpen && (
            <span className="font-bold text-base text-darkGray group-hover:text-black transition-colors tracking-tight">
              <span className="text-gray-500">Work</span><span className="text-sky-600">Loop</span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {filteredItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={cn(
              "flex items-center gap-4 px-3 py-2 rounded-lg transition-all duration-200 group relative outline-none",
              location.pathname === item.path 
                ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon size={20} className={cn("shrink-0 transition-colors", location.pathname === item.path ? "text-primary" : "group-hover:text-foreground")} />
            {sidebarOpen && <span className="text-sm transition-opacity duration-200">{item.name}</span>}
            {location.pathname === item.path && (
              <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 mt-auto">
        <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors outline-none",
            !sidebarOpen && "justify-center px-0"
          )} 
          onClick={logout}
        >
          <LogOut size={20} className="shrink-0" />
          {sidebarOpen && <span className="text-sm">Logout</span>}
        </Button>
      </div>
    </div>
  );

    return (
      <>
        <aside 
          className={cn(
            "hidden lg:flex flex-col h-screen transition-all duration-300 z-50 border-r bg-card relative",
            sidebarOpen ? "w-64" : "w-20"
          )}
        >
          {content}
          <div 
            className={cn(
              "absolute -right-2 top-1/2 -translate-y-1/2 flex items-center justify-center z-50 transition-all duration-300",
              sidebarOpen ? "translate-x-0" : "-translate-x-1"
            )}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full p-0 bg-card border shadow-sm hover:bg-accent cursor-pointer transition-transform hover:scale-110 flex items-center justify-center" 
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            </Button>
          </div>
        </aside>

         <Sheet>
          <SheetTrigger asChild={false}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden fixed top-3 left-3 z-50"
            >
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-card">
            {content}
          </SheetContent>
        </Sheet>
      </>
    );
};

export default Sidebar;
