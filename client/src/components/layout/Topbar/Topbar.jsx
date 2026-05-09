import { ThemeToggle } from "@/components/theme/ThemeToggle";
import LiveClock from "@/components/ui/LiveClock";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, LogOut, Settings, User, Trash2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiRequest } from "../../../api/apiClient";
import { AuthContext } from "../../../context/AuthContextInstance.js";
import { hasPermission } from "../../../lib/permissions";
import { db } from "../../../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";

const TopBar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        let notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort locally by createdAt
        notifs = notifs.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          return dateB - dateA;
        });
        
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch (err) {
        console.error('Error processing notifications:', err);
      }
    }, (error) => {
      console.error('Error listening to notifications:', error);
    });

    return () => {
      try { unsubscribe(); } catch (e) {}
    };
  }, [user?.uid]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        const notificationRef = doc(db, 'notifications', notification.id);
        await updateDoc(notificationRef, { read: true });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (notification.taskId) {
      navigate(`/tasks/${notification.taskId}`);
      setOpen(false);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
        {hasPermission(user?.role, "DASHBOARD_ADMIN") && (
          <div className="flex items-center gap-1">
            <Badge
              variant="solid"
              className="bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-50 font-bold"
            >
              Verified
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <LiveClock />

        {user && (
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
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">Notifications</h3>
                <span className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </span>
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
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteNotification(e, notification.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        <ThemeToggle />

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
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate('/profile')}>
                <User size={16} />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate('/settings')}>
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
