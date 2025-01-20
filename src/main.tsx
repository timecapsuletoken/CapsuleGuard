import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App';
import DashboardPage from './pages/index'; // Dashboard content
import LockTokensPage from './pages/LockTokens'; // Lock Tokens content
import LockedTokensPage from './pages/LockedTokens'; // LockedTokens content

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // Main layout with navigation
    children: [
      { path: '', element: <DashboardPage /> }, 
      { path: 'locker', element: <LockTokensPage /> },
      { path: 'locked', element: <LockedTokensPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
