import { createBrowserRouter, RouterProvider } from 'react-router';
import ProtectedRoute from '../router/ProtectedRoute/ProtectedRoute';
import MainLayout from '../../components/layout/MainLayout';
import Login from '../../pages/auth/Login/Login';
import Dashboard from '../../pages/dashboard/Dashboard/Dashboard';
import TaskList from '../../pages/tasks/TaskList/TaskList';
import TaskDetail from '../../pages/tasks/TaskDetail/TaskDetail';
import Users from '../../pages/users/Users';
import Settings from '../../pages/settings/Settings';

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
            path: 'users',
            element: <Users />,
          },
          {
            path: 'settings',
            element: <Settings />,
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
