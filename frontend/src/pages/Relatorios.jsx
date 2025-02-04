import { Box, Typography, Container } from '@mui/material';
import Sidebar from '../components/Sidebar';

function Relatorios() {
  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: theme => theme.palette.background.default
    }}>
      <Sidebar />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Relatórios
        </Typography>
        {/* Conteúdo da página */}
      </Container>
    </Box>
  );
}

export default Relatorios; 