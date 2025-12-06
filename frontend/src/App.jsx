import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CssBaseline />
        <ProtectedRoute>
          <Outlet />
        </ProtectedRoute>
        <ToastContainer position="top-right" autoClose={3000} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
