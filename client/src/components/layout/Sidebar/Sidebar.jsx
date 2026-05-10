import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BarChart3,
  CheckCircle2,
  CheckSquare,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mobileCollapsed, setMobileCollapsed] = useState(false);

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

  const renderContent = (options = {}) => {
    const { onNavClick, collapsed } = options;
    const isCollapsed = collapsed !== undefined ? collapsed : !sidebarOpen;

    return (
      <div className="flex flex-col h-full py-6 overflow-hidden">
        <div className={cn("mb-8 flex", isCollapsed ? "justify-center px-0" : "px-6")}>
          <Link to="/dashboard" onClick={onNavClick} className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm group-hover:scale-110 transition-transform shadow-sm shrink-0">
              WL
            </div>
            {!isCollapsed && (
              <span className="font-bold text-base text-darkGray group-hover:text-black transition-colors tracking-tight whitespace-nowrap overflow-hidden">
                <span className="text-gray-500">Work</span><span className="text-sky-600">Loop</span>
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
          {filteredItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={onNavClick}
              className={cn(
                "flex items-center rounded-lg transition-all duration-200 group relative outline-none",
                isCollapsed
                  ? "justify-center mx-2 h-10 w-[calc(100%-1rem)]"
                  : "gap-4 px-3 py-2 mx-2",
                location.pathname === item.path 
                  ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon size={20} className={cn("shrink-0 transition-colors", location.pathname === item.path ? "text-primary" : "group-hover:text-foreground")} />
              {!isCollapsed && <span className="text-sm transition-opacity duration-200 whitespace-nowrap overflow-hidden">{item.name}</span>}
              {location.pathname === item.path && (
                <div className={cn("absolute w-1 h-6 bg-primary rounded-r-full", isCollapsed ? "left-0 top-1/2 -translate-y-1/2" : "left-0")} />
              )}
            </Link>
          ))}
        </nav>

        <div className={cn("mt-auto", isCollapsed ? "flex justify-center p-2" : "p-3")}>
          <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
          <Button 
            variant="ghost" 
            className={cn(
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors outline-none shrink-0",
              isCollapsed
                ? "h-10 w-10 p-0 flex items-center justify-center"
                : "w-full justify-start gap-4 px-3 py-2"
            )} 
            onClick={() => { onNavClick?.(); logout(); }}
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-sm">Logout</span>}
          </Button>
        </div>
      </div>
    );
  };

  const ToggleButton = ({ collapsed, onToggle }) => (
    <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 rounded-full bg-card border shadow-sm hover:bg-accent transition-transform hover:scale-110 flex items-center justify-center" 
        onClick={onToggle}
        aria-label={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </Button>
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
          {renderContent()}
          <ToggleButton 
            collapsed={!sidebarOpen} 
            onToggle={toggleSidebar}
          />
        </aside>

        <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (open) setMobileCollapsed(false); }}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("lg:hidden fixed top-3 left-3 z-50", sheetOpen && "hidden")}
            >
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-card/95 backdrop-blur-xl" showCloseButton={false}>
            <div className="relative h-full overflow-visible">
              {renderContent({ onNavClick: () => setSheetOpen(false), collapsed: mobileCollapsed })}
              <ToggleButton 
                collapsed={mobileCollapsed} 
                onToggle={() => setMobileCollapsed(!mobileCollapsed)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
};

export default Sidebar;
