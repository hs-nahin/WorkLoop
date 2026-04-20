
import { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { AppContext } from "../../../context/AppContext.jsx";
import { useAuth } from "../../../context/AuthContextInstance";

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useContext(AppContext);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

import { LayoutDashboard, ClipboardList, Users, LogOut, Menu, X } from "lucide-react";

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useContext(AppContext);
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "IT OFFICER"] },
    { name: "Tasks", path: "/tasks", icon: ClipboardList, roles: ["ADMIN", "IT OFFICER"] },
    { name: "Users", path: "/users", icon: Users, roles: ["ADMIN"] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className={`fixed left-0 top-0 h-screen transition-all duration-500 z-50 ${sidebarOpen ? "w-64" : "w-20"} bg-black/60 backdrop-blur-2xl border-r border-white/10`}>
      <div className="p-6 flex items-center justify-between">
        {sidebarOpen && <TextHighlighter text="WORKLOOP" className="font-black text-xl tracking-tighter text-white" />}
        <button onClick={toggleSidebar} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="mt-8 px-4 space-y-2">
        {filteredItems.map((item) => (
          <Link key={item.path} to={item.path} className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group ${location.pathname === item.path ? "bg-yellow-400 text-black font-bold shadow-[0_0_15px_rgba(250,204,21,0.3)]" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
            <item.icon size={22} className={location.pathname === item.path ? "text-black" : "group-hover:text-white transition-colors"} />
            {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-8 left-0 w-full px-4">
        <MagicCard className="cursor-pointer group" onClick={handleLogout}>
          <div className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${!sidebarOpen && "justify-center"} text-gray-400 group-hover:text-red-400 group-hover:bg-red-500/10`}>
            <LogOut size={22} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </div>
        </MagicCard>
      </div>
    </aside>
  );
};
};

export default Sidebar;
