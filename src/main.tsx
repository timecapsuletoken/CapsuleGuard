import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App';
import DashboardPage from './pages/index'; // Dashboard content
import LockTokensPage from './pages/LockTokens'; // Orders content

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // Main layout with navigation
    children: [
      { path: '', element: <DashboardPage /> }, // Rendered inside <Outlet />
      { path: 'locker', element: <LockTokensPage /> }, // Rendered inside <Outlet />
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
