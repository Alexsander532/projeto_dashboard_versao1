import React from 'react';
import { Box } from '@mui/material';
import Dashboard from '../components/Dashboard';

export default function MercadoLivre() {
  return (
    <Box sx={{ 
      display: 'flex',
      height: '100vh',
      overflow: 'hidden', // Impede scroll na página principal
    }}>
      <Dashboard />
    </Box>
  );
} 