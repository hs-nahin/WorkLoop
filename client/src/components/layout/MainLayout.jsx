import React from 'react';
import { Outlet } from 'react-router';
import Sidebar from './Sidebar/Sidebar';
import Topbar from './Topbar/Topbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />
      <div className="transition-all duration-500 pl-0 sm:pl-64 lg:pl-64">
        <Topbar />
        <main className="pt-20 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
