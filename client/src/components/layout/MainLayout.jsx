import { Outlet } from 'react-router';
import Sidebar from './Sidebar/Sidebar';
import TopBar from './TopBar/TopBar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pt-16 scroll-smooth">
            <div className="max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
