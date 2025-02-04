import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ProdutosTable from '../components/ProdutosTable';
import ProdutoForm from '../components/ProdutoForm';
import Sidebar from '../components/Sidebar';

export default function Produtos() {
  const theme = useTheme();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Conteúdo Principal */}
      <Box sx={{ flexGrow: 1, p: 3, ml: '64px' }}>
        {/* Header */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Produtos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gerencie seus produtos cadastrados
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
            sx={{
              bgcolor: 'success.main',
              '&:hover': {
                bgcolor: 'success.dark',
              },
              borderRadius: '8px',
              textTransform: 'none',
              px: 3
            }}
          >
            Novo Produto
          </Button>
        </Paper>

        {/* Tabela */}
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <ProdutosTable formOpen={formOpen} setFormOpen={setFormOpen} />
        </Paper>
      </Box>
    </Box>
  );
} 