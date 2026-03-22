// ============================================
// ROUTES - Configuração de Rotas
// ============================================

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthProvider } from '@features/auth';
import { Dashboard } from '@features/dashboard';
import { Editor } from '@features/editor';
import App from './App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <App />
      </AuthProvider>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'editor',
        element: <Editor onBack={() => window.history.back()} />,
      },
      {
        path: 'editor/:projectId',
        element: <Editor onBack={() => window.history.back()} />,
      },
      {
        path: 'templates',
        element: <div>Templates Page</div>,
      },
      {
        path: 'settings',
        element: <div>Settings Page</div>,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
