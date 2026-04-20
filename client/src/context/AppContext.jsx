import { createContext } from "react";

export const AppContext = createContext({
  sidebarOpen: true,
  toggleSidebar: () => {},
  globalLoading: false,
  setGlobalLoading: () => {},
});