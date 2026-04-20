import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import TextHighlighter from "../../animations/TextHighlighter";


const Topbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <header className="h-16 fixed top-0 right-0 left-0 z-40 bg-black/20 backdrop-blur-md border-b border-white/5 px-6 flex items-center justify-between">
      <div className="text-sm text-gray-500">
        <TextHighlighter text={`Current Session: ${user?.role || "Guest"}`} className="text-xs" />
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-gray-400 font-medium">{user?.name || "User"}</p>
          <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold">{user?.role || "Role"}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-yellow-400 to-orange-600 p-0.5">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">
            {user?.name?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;