import { useCallback, useMemo, useState } from "react";
import { AppContext } from "./AppContext";

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      sidebarOpen,
      toggleSidebar,
    }),
    [sidebarOpen, toggleSidebar]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
