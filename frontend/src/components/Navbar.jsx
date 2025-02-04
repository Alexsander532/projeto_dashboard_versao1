import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Badge,
  Switch,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';

export default function Navbar({ onToggleSidebar, darkMode, onToggleDarkMode }) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationsAnchorEl(null);
  };

  // Dados fictícios de notificações
  const notifications = [
    { id: 1, message: 'Produto "Kit Gabinete Premium Plus" está com estoque baixo', time: '5 min atrás' },
    { id: 2, message: 'Nova venda realizada no Mercado Livre', time: '15 min atrás' },
    { id: 3, message: 'Atualização de preços pendente', time: '1 hora atrás' },
  ];

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[2],
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={onToggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          Dashboard de Vendas
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Dark Mode Toggle */}
          <Tooltip title={darkMode ? "Modo Claro" : "Modo Escuro"}>
            <IconButton color="inherit" onClick={onToggleDarkMode}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notificações">
            <IconButton
              color="inherit"
              onClick={handleNotificationsMenuOpen}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Settings */}
          <Tooltip title="Configurações">
            <IconButton color="inherit">
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Tooltip title="Perfil">
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleProfileMenuOpen}
            >
              <AccountCircle />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleMenuClose}>Meu Perfil</MenuItem>
          <MenuItem onClick={handleMenuClose}>Configurações</MenuItem>
          <MenuItem onClick={handleMenuClose}>Sair</MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsAnchorEl}
          open={Boolean(notificationsAnchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              width: 320,
              maxHeight: 400,
            }
          }}
        >
          {notifications.map((notification) => (
            <MenuItem 
              key={notification.id} 
              onClick={handleMenuClose}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                '&:last-child': {
                  borderBottom: 'none',
                }
              }}
            >
              <Typography variant="body2">
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notification.time}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
