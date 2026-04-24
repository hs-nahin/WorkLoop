import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContextInstance.js";

const TopBar = () => {
  const { user, logout } = useContext(AuthContext);
  
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case "ADMIN":
        return "bg-green-50 dark:bg-green-800";
      case "IT_OFFICER":
        return "bg-blue-50 dark:bg-blue-800";
      case "ASSISTANT":
        return "bg-purple-50 dark:bg-purple-800";
      default:
        return "bg-gray-50 dark:bg-gray-800";
    }
  };

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <Badge 
            variant="outline" 
            className={`font-medium opacity-70 ${getRoleBadgeColor(user?.role)} text-foreground`}
          >
            {user?.role || "Guest"} Session
          </Badge>
        </div>
        {user?.role === "ADMIN" && (
          <div className="flex items-center gap-1">
            <Badge 
              variant="solid" 
              className="bg-green-500 text-white font-bold"
            >
              Verified
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell size={20}/>
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
        </Button>
        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 p-1 pl-2 rounded-full border hover:bg-accent transition-colors cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-foreground leading-none">{user?.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{user?.role || "Role"}</p>
              </div>
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={user?.profileImage} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <User size={16} />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Settings size={16} />
              <span>Settings</span>
            </DropdownMenuItem>
            <div className="h-px bg-border my-1" />
            <DropdownMenuItem 
              className="gap-2 text-destructive focus:text-destructive cursor-pointer" 
              onClick={logout}
            >
              <LogOut size={16} />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;