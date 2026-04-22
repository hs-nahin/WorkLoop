import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Building2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Users
} from "lucide-react";
import { useContext } from "react";
import { Link, useLocation } from "react-router";
import { AppContext } from "../../../context/AppContext.jsx";
import { AuthContext } from "../../../context/AuthContextInstance.js";
import { useCompany } from "../../../context/CompanyContext.jsx";
import { cn } from "../../../lib/utils";
import TextHighlighter from "../../animations/TextHighlighter.jsx";

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useContext(AppContext);
  const { user, logout } = useContext(AuthContext);
  const { company } = useCompany();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "IT OFFICER", "USER"] },
    { name: "Tasks", path: "/tasks", icon: CheckSquare, roles: ["ADMIN", "IT OFFICER"] },
    { name: "Users", path: "/users", icon: Users, roles: ["ADMIN"] },
    { name: "Settings", path: "/settings", icon: Building2, roles: ["ADMIN"] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  const content = (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-8 flex items-center justify-between">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="Logo" className="h-8 w-auto" />
            ) : (
              <TextHighlighter text={company?.companyName || 'WORKLOOP'} className="font-black text-xl tracking-tighter" />
            )}
          </div>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-2 h-9 w-9" 
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {filteredItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={cn(
              "flex items-center gap-4 px-3 py-2 rounded-lg transition-all duration-200 group",
              location.pathname === item.path 
                ? "bg-primary text-primary-foreground font-medium shadow-md" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon size={20} className={cn("shrink-0", location.pathname === item.path ? "text-primary-foreground" : "group-hover:text-foreground")} />
            {sidebarOpen && <span className="text-sm">{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-3 mt-auto border-t pt-4">
        {sidebarOpen && (
          <div className="px-3 mb-2 text-xs text-muted-foreground">
            {user?.name || user?.email?.split('@')[0]}
          </div>
        )}
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            !sidebarOpen && "justify-center px-0"
          )} 
          onClick={logout}
        >
          <LogOut size={20} className="shrink-0" />
          {sidebarOpen && <span className="text-sm">Logout</span>}
        </Button>
        {sidebarOpen && (
          <p className="px-3 mt-4 text-xs text-muted-foreground text-center">
            Powered by WorkLoop
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside 
        className={cn(
          "hidden lg:flex flex-col h-screen transition-all duration-300 z-50 border-r bg-card",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {content}
      </aside>

      <Sheet>
        <SheetTrigger asChild>
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
