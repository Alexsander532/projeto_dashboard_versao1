import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRoutes from './routes';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
}

export default App;
