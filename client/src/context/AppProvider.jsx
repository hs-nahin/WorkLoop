import { useCallback, useMemo, useState } from "react";
import { AppContext } from "./AppContext";

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      sidebarOpen,
      toggleSidebar,
      globalLoading,
      setGlobalLoading,
    }),
    [sidebarOpen, toggleSidebar, globalLoading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
