import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <AppContext.Provider value={{ sidebarOpen, toggleSidebar, globalLoading, setGlobalLoading }}>
      {children}
    </AppContext.Provider>
  );
};
