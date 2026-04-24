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
  Plus,
  Search,
  Users
} from "lucide-react";
import { useContext } from "react";
import { Link, useLocation } from "react-router";
import { AppContext } from "../../../context/AppContext.jsx";
import { AuthContext } from "../../../context/AuthContextInstance.js";
import { cn } from "../../../lib/utils";

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useContext(AppContext);
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "IT OFFICER", "ASSISTANT"] },
    { name: "Tasks", path: "/tasks", icon: CheckSquare, roles: ["ADMIN", "IT OFFICER", "ASSISTANT"] },
    { name: "Users", path: "/users", icon: Users, roles: ["ADMIN"] },
    { name: "Company", path: "/company", icon: Building2, roles: ["ADMIN"] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  const content = (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-8 flex items-center justify-between">
        {/* WorkLoop Brand Logo and Name */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm group-hover:scale-110 transition-transform">
            WL
          </div>
          {sidebarOpen && (
            <span className="font-bold text-base text-darkGray group-hover:text-black transition-colors">
              <span className="text-gray-500">Work</span><span className="text-sky-600">Loop</span>
            </span>
          )}
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-2 h-9 w-9 cursor-pointer" 
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

      <div className="p-3 mt-auto">
        {user && user.role === "ADMIN" && (
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer",
                !sidebarOpen && "justify-center px-0"
              )} 
            >
              <Plus size={20} className="shrink-0" />
              {sidebarOpen && <span className="text-sm">Create New Task</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer",
                !sidebarOpen && "justify-center px-0"
              )} 
            >
              <Search size={20} className="shrink-0" />
              {sidebarOpen && <span className="text-sm">View All Tasks</span>}
            </Button>
          </div>
        )}
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer",
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