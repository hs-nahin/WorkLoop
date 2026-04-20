import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import TextHighlighter from "../../animations/TextHighlighter";
import { Bell, Search, User as UserIcon } from "lucide-react";

const Topbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <header className="h-16 fixed top-0 right-0 left-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="text-sm text-gray-500 hidden md:block">
          <TextHighlighter text={`Session: ${user?.role || "Guest"}`} className="text-xs uppercase tracking-widest opacity-60" />
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-400 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search workspace..." 
            className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-xs text-white outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30 transition-all w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full border border-black"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-white font-medium">{user?.name || "User"}</p>
            <p className="text-[10px] text-yellow-400 uppercase tracking-tighter font-bold">{user?.role || "Role"}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 p-[2px] shadow-[0_0_10px_rgba(250,204,21,0.3)]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;