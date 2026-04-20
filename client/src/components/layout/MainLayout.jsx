import React from 'react';
import { Outlet } from 'react-router';
import Sidebar from './Sidebar/Sidebar';
import Topbar from './Topbar/Topbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Topbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
