import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SidebarProvider>
          <CssBaseline />
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
          <ToastContainer position="top-right" autoClose={3000} />
        </SidebarProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
