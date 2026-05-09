import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/auth/Login/Login";
import Dashboard from "@/pages/dashboard/Dashboard/Dashboard";
import UserPerformanceDashboard from "@/pages/dashboard/UserPerformanceDashboard/UserPerformanceDashboard";
import AuditLogs from "@/pages/audit-logs/AuditLogs/AuditLogs";
import PermissionsEditor from "@/pages/permissions/PermissionsEditor/PermissionsEditor";
import Settings from "@/pages/settings/Settings";
import Profile from "@/pages/profile/Profile";
import TaskDetail from "@/pages/tasks/TaskDetail/TaskDetail";
import TaskList from "@/pages/tasks/TaskList/TaskList";
import CompletedTasks from "@/pages/tasks/CompletedTasks/CompletedTasks";
import { createBrowserRouter, RouterProvider } from "react-router";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";


const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'tasks',
            element: <TaskList />,
          },
          {
            path: 'tasks/:id',
            element: <TaskDetail />,
          },
          {
            path: 'completed',
            element: <CompletedTasks />,
          },
            {
              path: 'settings',
              element: <Settings />,
            },
            {
              path: 'profile',
              element: <Profile />,
            },
            {
              path: 'performance',
              element: <UserPerformanceDashboard />,
            },
            {
              path: 'audit-logs',
              element: <AuditLogs />,
            },
            {
              path: 'permissions',
              element: <PermissionsEditor />,
            },

          {
            index: true,
            element: <Dashboard />,
          },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
