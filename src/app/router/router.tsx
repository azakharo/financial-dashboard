import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import {DashboardPage} from '@/pages/dashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
