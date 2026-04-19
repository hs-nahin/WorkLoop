import React from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useContext } from "react";
import MagicCard from "../../components/animations/MagicCard.jsx";
import TextHighlighter from "../../components/animations/TextHighlighter.jsx";
import { AppContext } from "../../../context/AppContext";
import { AuthContext } from "../../../context/AuthContext";

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useContext(AppContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "??", roles: ["ADMIN", "IT OFFICER"] },
    { name: "Tasks", path: "/tasks", icon: "??", roles: ["ADMIN", "IT OFFICER"] },
    { name: "Users", path: "/users", icon: "??", roles: ["ADMIN"] },
    { name: "Company", path: "/company", icon: "??", roles: ["ADMIN"] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className={`fixed left-0 top-0 h-screen transition-all duration-500 z-50 ${sidebarOpen ? "w-64" : "w-20"} bg-black/40 backdrop-blur-2xl border-r border-white/10`}>
      <div className="p-6 flex items-center justify-between">
        {sidebarOpen && <TextHighlighter text="WORKLOOP" className="font-black text-xl tracking-tighter" />}
        <button onClick={toggleSidebar} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          {sidebarOpen ? "?" : "?"}
        </button>
      </div>

      <nav className="mt-8 px-4 space-y-2">
        {filteredItems.map((item) => (
          <Link key={item.path} to={item.path} className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group ${location.pathname === item.path ? "bg-yellow-400 text-black font-bold" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
            <span className="text-xl">{item.icon}</span>
            {sidebarOpen && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-8 left-0 w-full px-4">
        <MagicCard className="cursor-pointer" onClick={logout}>
          <div className={`flex items-center gap-4 ${!sidebarOpen && "justify-center"}`}>
            <span className="text-xl">??</span>
            {sidebarOpen && <span className="text-sm font-medium text-white">Logout</span>}
          </div>
        </MagicCard>
      </div>
    </aside>
  );
};

export default Sidebar;
