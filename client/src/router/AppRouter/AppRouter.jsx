import { createBrowserRouter, RouterProvider } from 'react-router';
import MainLayout from '../../components/layout/MainLayout';
import Login from '../../pages/auth/Login/Login';
import Dashboard from '../../pages/dashboard/Dashboard/Dashboard';
import Settings from '../../pages/settings/Settings';
import TaskDetail from '../../pages/tasks/TaskDetail/TaskDetail';
import TaskList from '../../pages/tasks/TaskList/TaskList';
import Users from '../../pages/users/Users';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';


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
            element: <ProtectedRoute allowedRoles={['ADMIN']} />, 
            children: [{ element: <Users /> }]
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
