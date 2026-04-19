import { createContext, useCallback, useMemo, useState } from "react";

export const AppContext = createContext({
  sidebarOpen: true,
  toggleSidebar: () => {},
  globalLoading: false,
  setGlobalLoading: () => {},
});

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const value = useMemo(() => ({
    sidebarOpen,
    toggleSidebar,
    globalLoading,
    setGlobalLoading
  }), [sidebarOpen, toggleSidebar, globalLoading]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};