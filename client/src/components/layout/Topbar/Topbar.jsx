import { ThemeToggle } from "@/components/theme/ThemeToggle";
import LiveClock from "@/components/ui/LiveClock";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, LogOut, Settings, User, Trash2, Megaphone } from "lucide-react";
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

   const handleMarkAllRead = async (e) => {
     e.stopPropagation();
     try {
       const unreadNotifications = notifications.filter(n => !n.read);
       for (const notification of unreadNotifications) {
         const notificationRef = doc(db, 'notifications', notification.id);
         await updateDoc(notificationRef, { read: true });
       }
     } catch (error) {
       console.error('Error marking all notifications as read:', error);
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
    <header className="h-16 border-b bg-card/80 backdrop-blur-md px-2 sm:px-4 md:px-6 pl-14 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2 sm:gap-4">
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
              className="bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-50 font-bold text-[10px] sm:text-xs px-1.5 sm:px-2.5"
            >
              Verified
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
        <LiveClock />

        {user && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground cursor-pointer h-9 w-9 sm:h-10 sm:w-10">
                <Bell size={18} className="sm:size-[20px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center border-2 border-card">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
             <PopoverContent className="w-[calc(100vw-1.5rem)] sm:w-80 p-0 mr-4 sm:mr-0" align="end" sideOffset={8}>
               <div className="p-3 sm:p-4 border-b flex justify-between items-center">
                 <h3 className="text-sm sm:text-base font-semibold">Notifications</h3>
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] sm:text-xs text-muted-foreground">
                     {unreadCount} unread
                   </span>
                   {unreadCount > 0 && (
                     <button
                       onClick={handleMarkAllRead}
                       className="text-[10px] sm:text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                     >
                       Mark all read
                     </button>
                   )}
                 </div>
               </div>
              <div className="max-h-72 sm:max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 sm:p-4 border-b cursor-pointer hover:bg-accent transition-colors ${!notification.read ? 'bg-accent/50' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0 flex gap-2 sm:gap-3">
                          <div className="mt-0.5 shrink-0">
                            {notification.type === 'announcement' ? (
                              <Megaphone size={12} className="sm:size-[14px] text-primary" />
                            ) : (
                              <Bell size={12} className="sm:size-[14px] text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium leading-snug break-words">{notification.message}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteNotification(e, notification.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                        >
                          <Trash2 size={12} className="sm:size-[14px]" />
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
            <div className="flex items-center gap-1 sm:gap-3 p-0.5 sm:p-1 sm:pl-2 rounded-full border hover:bg-accent transition-colors cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-foreground leading-none">{user?.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{user?.role || "Role"}</p>
              </div>
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border-2 border-primary/20">
                <AvatarImage src={user?.profileImage} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56">
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate('/profile')}>
                <User size={15} className="sm:size-[16px]" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate('/settings')}>
                <Settings size={15} className="sm:size-[16px]" />
                <span>Settings</span>
              </DropdownMenuItem>
              <div className="h-px bg-border my-1" />
              <DropdownMenuItem
                variant="destructive"
                className="gap-2 cursor-pointer"
                onClick={logout}
              >
                <LogOut size={15} className="sm:size-[16px]" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>

        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
