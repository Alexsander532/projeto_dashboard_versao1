import { Box } from '@mui/material';
import Dashboard from '../components/Dashboard';
import Sidebar from '../components/Sidebar';

function MagazineLuiza() {
  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: theme => theme.palette.background.default
    }}>
      <Sidebar />
      <Box sx={{ 
        flexGrow: 1,
        marginLeft: '80px',
        width: 'calc(100% - 80px)'
      }}>
        <Dashboard marketplace="magalu" />
      </Box>
    </Box>
  );
}

export default MagazineLuiza; 