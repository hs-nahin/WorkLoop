import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BarChart3,
  CheckCircle2,
  CheckSquare,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { AppContext } from "../../../context/AppContext.jsx";
import { AuthContext } from "../../../context/AuthContextInstance.js";
import { cn } from "../../../lib/utils";
import { hasPermission } from "../../../lib/permissions";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["PROFILE_VIEW"] },
  { name: "Tasks", path: "/tasks", icon: CheckSquare, roles: ["TASK_VIEW_LIST"] },
  { name: "Completed", path: "/completed", icon: CheckCircle2, roles: ["TASK_VIEW_LIST"] },
  { name: "Announcements", path: "/announcements", icon: Megaphone, roles: ["ANNOUNCEMENT_VIEW"] },
  { name: "Announcement History", path: "/announcements-history", icon: History, roles: ["ANNOUNCEMENT_HISTORY_VIEW"] },
  { name: "User Management", path: "/user-management", icon: Users, roles: ["USER_LIST"] },
  { name: "Performance", path: "/performance", icon: BarChart3, roles: ["PERFORMANCE_VIEW"] },
  { name: "Audit Logs", path: "/audit-logs", icon: History, roles: ["AUDIT_LOG_VIEW"] },
  { name: "Permissions", path: "/permissions", icon: Shield, roles: ["ROLE_MANAGE"] },
];

const WorkLoopLogo = () => (
  <img src="/logo-v2.png" alt="WorkLoop" className="w-full h-full object-contain" />
);

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useContext(AppContext);
  const { user, logout, permissionsVersion } = useContext(AuthContext);
  const location = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mobileCollapsed, setMobileCollapsed] = useState(false);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      return item.roles.some(r => hasPermission(user?.role, r));
    });
  }, [user?.role, permissionsVersion]);

  const renderContent = (options = {}) => {
    const { onNavClick, collapsed } = options;
    const isCollapsed = collapsed !== undefined ? collapsed : !sidebarOpen;
    const isMobile = !!onNavClick;

    return (
      <div className="flex flex-col h-full py-5">
        {/* Logo section */}
        <div className={cn("mb-7 flex animate-slide-in-left", isCollapsed ? "justify-center" : "px-5")}
          style={{ animationDelay: isMobile ? '20ms' : undefined }}>
          <Link to="/dashboard" onClick={onNavClick} className={cn("flex items-center group", isCollapsed ? "justify-center" : "gap-2.5")}>
            <div className={cn("shrink-0 group-hover:scale-105 transition-transform duration-300", isCollapsed ? "size-9" : "size-8")}>
              <WorkLoopLogo />
            </div>
            <span className={cn(
              "font-bold text-base tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-out",
              isCollapsed ? "max-w-0 opacity-0 -translate-x-2" : "max-w-40 opacity-100 translate-x-0"
            )}>
              <span className="text-gray-500">Work</span><span className="text-sky-600">Loop</span>
            </span>
          </Link>
        </div>

        {/* Nav section header */}
        {!isCollapsed && (
          <div className="px-5 mb-2 animate-slide-in-left"
            style={{ animationDelay: isMobile ? '30ms' : undefined }}>
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em]">
              Navigation
            </p>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 space-y-[1px]">
          {filteredItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavClick}
                className={cn(
                  "flex items-center transition-all duration-200 group relative outline-none",
                  isCollapsed
                    ? "justify-center size-9 mx-auto rounded-lg"
                    : "gap-3 py-1.5 px-3 mx-2.5 rounded-lg",
                  isActive
                    ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-medium"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/40",
                  isMobile && "animate-slide-in-left"
                )}
                style={{ animationDelay: isMobile ? `${80 + index * 50}ms` : undefined }}
              >
                <item.icon size={18} className={cn(
                  "shrink-0 transition-colors duration-200",
                  isActive
                    ? "text-sky-500 dark:text-sky-400"
                    : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )} />
                <span
                  className={cn(
                    "text-[13px] whitespace-nowrap overflow-hidden transition-all duration-300 ease-out",
                    isCollapsed ? "max-w-0 opacity-0 -translate-x-2" : "max-w-40 opacity-100 translate-x-0"
                  )}
                  style={{ transitionDelay: isCollapsed ? '0ms' : `${40 + index * 25}ms` }}
                >
                  {item.name}
                </span>
                {isActive && !isCollapsed && (
                  <div className="ml-auto size-1.5 rounded-full bg-sky-400 dark:bg-sky-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className={cn("mt-auto animate-slide-in-left", isCollapsed ? "flex justify-center p-2" : "px-3 py-2")}
          style={{ animationDelay: isMobile ? `${80 + filteredItems.length * 50}ms` : undefined }}>
          {hasPermission(user?.role, 'TASK_CREATE') && <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />}
          <Button
            variant="ghost"
            className={cn(
              "text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 outline-none shrink-0",
              isCollapsed
                ? "size-9 p-0 flex items-center justify-center mx-auto rounded-lg"
                : "w-full justify-start gap-2.5 px-2.5 py-1.5 mx-2.5 rounded-lg"
            )}
            onClick={() => { onNavClick?.(); logout(); }}
          >
            <LogOut size={16} className="shrink-0" />
            <span className={cn(
              "text-[13px] whitespace-nowrap overflow-hidden transition-all duration-300 ease-out",
              isCollapsed ? "max-w-0 opacity-0 -translate-x-2" : "max-w-16 opacity-100 translate-x-0"
            )}>
              Logout
            </span>
          </Button>
        </div>
      </div>
    );
  };

  const ToggleButton = ({ collapsed, onToggle }) => (
    <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center">
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-full bg-card border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110 transition-all duration-200 flex items-center justify-center"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen size={12} /> : <PanelLeftClose size={12} />}
      </Button>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen transition-all duration-300 z-50 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-background relative",
          sidebarOpen ? "w-64" : "w-[68px]"
        )}
      >
        {renderContent()}
        <ToggleButton collapsed={!sidebarOpen} onToggle={toggleSidebar} />
      </aside>

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (open) setMobileCollapsed(false); }}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("lg:hidden fixed top-3 left-3 z-50", sheetOpen && "hidden")}
          >
            <div className="relative w-4.5 h-4.5 flex flex-col items-center justify-center gap-[3.5px]">
              <span className="block w-full h-[1.5px] bg-current rounded-full transition-all duration-300 origin-center" />
              <span className="block w-full h-[1.5px] bg-current rounded-full transition-all duration-300" />
              <span className="block w-full h-[1.5px] bg-current rounded-full transition-all duration-300 origin-center" />
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-white/95 dark:bg-background/95 backdrop-blur-xl transition-all duration-300 data-starting-style:scale-95 data-ending-style:scale-95" showCloseButton={false} style={{ width: mobileCollapsed ? '5rem' : '16rem' }}>
          <div className="relative h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-50 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg"
              onClick={() => setSheetOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </Button>
            {renderContent({ onNavClick: () => setSheetOpen(false), collapsed: mobileCollapsed })}
            <ToggleButton collapsed={mobileCollapsed} onToggle={() => setMobileCollapsed(!mobileCollapsed)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
