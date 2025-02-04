import { Box, Typography, Container } from '@mui/material';
import Sidebar from '../components/Sidebar';

function Alertas() {
  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: theme => theme.palette.background.default
    }}>
      <Sidebar />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Alertas
        </Typography>
        {/* Conteúdo da página */}
      </Container>
    </Box>
  );
}

export default Alertas; 