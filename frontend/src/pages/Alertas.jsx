import { Box, Typography, Container } from '@mui/material';
import { useSidebar } from '../contexts/SidebarContext';
import Sidebar from '../components/Sidebar';

function Alertas() {
  const { isHovered } = useSidebar();
  
  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: theme => theme.palette.background.default
    }}>
      <Sidebar />
      <Container maxWidth="xl" sx={{ 
        py: 4,
        ml: isHovered ? '200px' : '64px',
        transition: 'margin-left 0.3s ease'
      }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Alertas
        </Typography>
        {/* Conteúdo da página */}
      </Container>
    </Box>
  );
}

export default Alertas;