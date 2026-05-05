import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContextInstance.js";
import { apiRequest } from "../../../api/apiClient";

const TopBar = () => {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest({ endpoint: '/tasks/notifications' });
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await apiRequest({ 
          endpoint: `/tasks/notifications/${notification.id}/read`, 
          method: 'PATCH' 
        });
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Navigate to task
    if (notification.taskId) {
      window.location.href = `/tasks/${notification.taskId}`;
    }
  };

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
        {user?.role === 'ADMIN' && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground cursor-pointer">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center border-2 border-card">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${!notification.read ? 'bg-accent/50' : ''}`}
                    >
                      <p className="text-sm font-medium">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.createdAt?.toDate ? 
                          notification.createdAt.toDate().toLocaleString() : 
                          'Just now'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

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
