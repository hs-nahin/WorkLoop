import React, { useContext } from 'react';
import { Outlet } from 'react-router';
import Sidebar from './Sidebar/Sidebar';
import Topbar from './Topbar/Topbar';
import { AppContext } from '../../context/AppContext';

const MainLayout = () => {
  const { sidebarOpen } = useContext(AppContext);
  return (
    <div className="min-h-screen bg-black text-white selection:bg-yellow-400/30">
      <Topbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className={`flex-1 p-6 transition-all duration-500 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
