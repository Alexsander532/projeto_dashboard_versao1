import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  LocalShipping as LocalShippingIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ShoppingBasket as ShoppingBasketIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { text: 'Mercado Livre', icon: <ShoppingCartIcon />, path: '/mercado-livre' },
    { text: 'Magazine Luiza', icon: <StoreIcon />, path: '/magazine-luiza' },
    { text: 'Estoque', icon: <InventoryIcon />, path: '/estoque' },
    { text: 'Metas', icon: <AssessmentIcon />, path: '/metas' },
    // { text: 'Produtos', icon: <ShoppingBasketIcon />, path: '/produtos' }, // ITEM OCULTO - Trabalhando apenas com Estoque
    { text: 'Compras', icon: <LocalShippingIcon />, path: '/compras' },
    { text: 'Alertas', icon: <NotificationsIcon />, path: '/alertas' },
    { text: 'Configurações', icon: <SettingsIcon />, path: '/configuracoes' },
  ];

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        width: isHovered ? 200 : 64,
        height: '70vh',
        backgroundColor: theme.palette.background.paper,
        position: 'fixed',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1200,
        borderRadius: '0 16px 16px 0',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        transition: 'all 0.3s ease',
        overflow: 'hidden',
      }}
    >
      <List sx={{ width: '100%' }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              minHeight: 36,
              display: 'flex',
              justifyContent: isHovered ? 'flex-start' : 'center',
              px: isHovered ? 2 : 1,
              mb: 0.5,
              backgroundColor: location.pathname === item.path ? 
                'rgba(0, 0, 0, 0.04)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              borderRadius: '0 8px 8px 0',
              position: 'relative',
              '&::before': location.pathname === item.path ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 2,
                height: '50%',
                backgroundColor: theme.palette.primary.main,
                borderRadius: '0 2px 2px 0',
              } : {},
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: isHovered ? 32 : 'auto',
                color: location.pathname === item.path ? 
                  theme.palette.primary.main : theme.palette.text.secondary,
                '& .MuiSvgIcon-root': {
                  fontSize: 20,
                },
              }}
            >
              {item.icon}
            </ListItemIcon>
            {isHovered && (
              <ListItemText 
                primary={item.text}
                sx={{
                  opacity: 1,
                  ml: 1,
                  '& .MuiTypography-root': {
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }
                }}
              />
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}