import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme
} from '@mui/material';
import {
  AccountCircle,
  Logout as LogoutIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  ExitToApp as ExitIcon
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

function Configuracoes() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { isDark, setIsDark } = useAppTheme();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: theme => theme.palette.background.default
    }}>
      <Sidebar />
      <Box sx={{ 
        flexGrow: 1,
        ml: { xs: 0, sm: '240px' }, // Margem para compensar a sidebar
        transition: 'margin-left 0.3s ease'
      }}>
        <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 4 } }}>
          <Typography variant="h4" sx={{ mb: 6, fontWeight: 'bold' }}>
            Configurações
          </Typography>

        <Grid container spacing={4}>
          {/* Perfil do Usuário */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ 
              height: '100%',
              boxShadow: 3,
              borderRadius: 2
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Perfil do Usuário
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      backgroundColor: 'primary.main',
                      mr: 3
                    }}
                  >
                    <AccountCircle sx={{ fontSize: 48 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                      {user?.name || 'Bruno'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                      Login: {user?.login || 'Bruno'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Logado desde: {user?.loginTime ? new Date(user.loginTime).toLocaleString('pt-BR') : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Informações da Conta
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Usuário administrador do sistema de dashboard de vendas com acesso completo a todas as funcionalidades.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Configurações do Sistema */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ 
              height: '100%',
              boxShadow: 3,
              borderRadius: 2
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Preferências do Sistema
                </Typography>
                
                <List sx={{ p: 0 }}>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemIcon>
                      <PaletteIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body1" fontWeight="medium">
                          Tema Escuro
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Alternar entre tema claro e escuro
                        </Typography>
                      }
                    />
                    <Switch
                      checked={isDark}
                      onChange={handleThemeToggle}
                      color="primary"
                    />
                  </ListItem>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemIcon>
                      <NotificationsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body1" fontWeight="medium">
                          Notificações
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Receber alertas do sistema
                        </Typography>
                      }
                    />
                    <Switch
                      defaultChecked
                      color="primary"
                    />
                  </ListItem>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemIcon>
                      <LanguageIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body1" fontWeight="medium">
                          Idioma
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Português (Brasil)
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Segurança e Sessão */}
          <Grid item xs={12}>
            <Card sx={{ 
              boxShadow: 3,
              borderRadius: 2,
              mt: 2
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 4, fontWeight: 'bold' }}>
                  Segurança e Sessão
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="outlined"
                      startIcon={<SecurityIcon />}
                      fullWidth
                      size="large"
                      sx={{ 
                        py: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem'
                      }}
                    >
                      Alterar Senha
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="outlined"
                      startIcon={<ExitIcon />}
                      fullWidth
                      size="large"
                      sx={{ 
                        py: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem'
                      }}
                      onClick={handleLogoutClick}
                    >
                      Encerrar Outras Sessões
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<LogoutIcon />}
                      fullWidth
                      size="large"
                      sx={{ 
                        py: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: 2,
                        '&:hover': {
                          boxShadow: 4
                        }
                      }}
                      onClick={handleLogoutClick}
                    >
                      Sair do Sistema
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Dialog de Confirmação de Logout */}
        <Dialog
          open={logoutDialogOpen}
          onClose={handleLogoutCancel}
          aria-labelledby="logout-dialog-title"
          aria-describedby="logout-dialog-description"
        >
          <DialogTitle id="logout-dialog-title">
            Confirmar Saída
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="logout-dialog-description">
              Tem certeza de que deseja sair do sistema? Você será redirecionado para a tela de login.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleLogoutCancel} color="primary">
              Cancelar
            </Button>
            <Button 
              onClick={handleLogoutConfirm} 
              color="error" 
              variant="contained"
              startIcon={<LogoutIcon />}
            >
              Sair
            </Button>
          </DialogActions>
         </Dialog>
         </Container>
       </Box>
     </Box>
   );
 }

export default Configuracoes;