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
import AnnouncementsPage from "@/pages/announcements/AnnouncementsPage";
import AnnouncementHistory from "@/pages/announcements/AnnouncementHistory";
import UserManagement from "@/pages/admin/UserManagement/UserManagement";
import RegisterAdmin from "@/pages/auth/RegisterAdmin/RegisterAdmin";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { createBrowserRouter, RouterProvider } from "react-router";
import ProtectedRoute from "@/router/ProtectedRoute/ProtectedRoute";


const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <RegisterAdmin />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            element: <ProtectedRoute allowedPermissions={['PROFILE_VIEW']} />,
            children: [
              {
                path: 'dashboard',
                element: <ErrorBoundary><Dashboard /></ErrorBoundary>,
              },
              {
                path: 'settings',
                element: <ErrorBoundary><Settings /></ErrorBoundary>,
              },
              {
                path: 'profile',
                element: <ErrorBoundary><Profile /></ErrorBoundary>,
              },
              {
                index: true,
                element: <ErrorBoundary><Dashboard /></ErrorBoundary>,
              },
            ],
          },
          {
            element: <ProtectedRoute allowedPermissions={['TASK_VIEW_LIST']} />,
            children: [
              {
                path: 'tasks',
                element: <ErrorBoundary><TaskList /></ErrorBoundary>,
              },
              {
                path: 'tasks/:id',
                element: <ErrorBoundary><TaskDetail /></ErrorBoundary>,
              },
              {
                path: 'completed',
                element: <ErrorBoundary><CompletedTasks /></ErrorBoundary>,
              },
            ],
          },
          {
            element: <ProtectedRoute allowedPermissions={['ANNOUNCEMENT_VIEW']} />,
            children: [
              {
                path: 'announcements',
                element: <ErrorBoundary><AnnouncementsPage /></ErrorBoundary>,
              },
            ],
          },
          {
            element: <ProtectedRoute allowedPermissions={['ANNOUNCEMENT_HISTORY_VIEW']} />,
            children: [
              {
                path: 'announcements-history',
                element: <ErrorBoundary><AnnouncementHistory /></ErrorBoundary>,
              },
            ],
          },
          {
            element: <ProtectedRoute allowedPermissions={['USER_LIST']} />,
            children: [
              {
                path: 'user-management',
                element: <ErrorBoundary><UserManagement /></ErrorBoundary>,
              },
            ],
          },
          {
            element: <ProtectedRoute allowedPermissions={['PERFORMANCE_VIEW']} />,
            children: [
              {
                path: 'performance',
                element: <ErrorBoundary><UserPerformanceDashboard /></ErrorBoundary>,
              },
            ],
          },
          {
            element: <ProtectedRoute allowedPermissions={['AUDIT_LOG_VIEW']} />,
            children: [
              {
                path: 'audit-logs',
                element: <ErrorBoundary><AuditLogs /></ErrorBoundary>,
              },
            ],
          },
          {
            element: <ProtectedRoute allowedPermissions={['ROLE_MANAGE']} />,
            children: [
              {
                path: 'permissions',
                element: <ErrorBoundary><PermissionsEditor /></ErrorBoundary>,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
