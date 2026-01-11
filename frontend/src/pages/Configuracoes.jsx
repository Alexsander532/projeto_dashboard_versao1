// frontend/src/pages/Configuracoes.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
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
  IconButton,
  Chip,
  TextField,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { useSidebar } from '../contexts/SidebarContext';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Business as BusinessIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
  Key as KeyIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Shield as ShieldIcon,
  CloudSync as CloudSyncIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

// Componente de Item de Configuração
const SettingItem = ({ icon: Icon, title, description, action, divider = true }) => {
  const theme = useTheme();
  return (
    <>
      <ListItem sx={{ py: 2, px: 0 }}>
        <ListItemIcon sx={{ minWidth: 48 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main'
            }}
          >
            <Icon fontSize="small" />
          </Box>
        </ListItemIcon>
        <ListItemText
          primary={<Typography fontWeight="600">{title}</Typography>}
          secondary={<Typography variant="body2" color="text.secondary">{description}</Typography>}
        />
        {action}
      </ListItem>
      {divider && <Divider />}
    </>
  );
};

// Componente de Seção
const SettingSection = ({ title, icon: Icon, children }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: '16px',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Icon color="primary" />
        <Typography variant="h6" fontWeight="700">
          {title}
        </Typography>
      </Box>
      <List sx={{ p: 0 }}>
        {children}
      </List>
    </Paper>
  );
};

function Configuracoes() {
  const theme = useTheme();
  const { isHovered } = useSidebar();
  const { user, logout } = useAuth();
  const { isDark, setIsDark } = useAppTheme();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [tabAtiva, setTabAtiva] = useState(0);

  // Estados de configurações
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [sincronizacaoAuto, setSincronizacaoAuto] = useState(true);
  const [alertasEstoque, setAlertasEstoque] = useState(true);

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, ml: isHovered ? '200px' : '64px', transition: 'margin 0.3s' }}>
        <Container maxWidth={false} sx={{ py: 3, maxWidth: '1200px' }}>

          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight="800" sx={{ mb: 0.5 }}>
              Configurações
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie suas preferências e configurações do sistema
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Coluna Esquerda - Perfil */}
            <Grid item xs={12} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.divider}`,
                  textAlign: 'center'
                }}
              >
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    mx: 'auto',
                    mb: 2,
                    fontSize: '2.5rem',
                    fontWeight: 700
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>

                <Typography variant="h5" fontWeight="700" sx={{ mb: 0.5 }}>
                  {user?.name || 'Usuário'}
                </Typography>

                <Chip
                  label="Administrador"
                  size="small"
                  color="primary"
                  sx={{ mb: 2, fontWeight: 600 }}
                />

                <Divider sx={{ my: 2 }} />

                <Box sx={{ textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Login</Typography>
                      <Typography variant="body2" fontWeight="500">{user?.login || 'admin'}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <ShieldIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Nível de Acesso</Typography>
                      <Typography variant="body2" fontWeight="500">Acesso Total</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CloudSyncIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Última Sincronização</Typography>
                      <Typography variant="body2" fontWeight="500">Agora</Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<LogoutIcon />}
                  onClick={() => setLogoutDialogOpen(true)}
                  sx={{ textTransform: 'none', borderRadius: '10px' }}
                >
                  Sair do Sistema
                </Button>
              </Paper>
            </Grid>

            {/* Coluna Direita - Configurações */}
            <Grid item xs={12} lg={8}>
              {/* Aparência */}
              <SettingSection title="Aparência" icon={PaletteIcon}>
                <SettingItem
                  icon={PaletteIcon}
                  title="Tema Escuro"
                  description="Alternar entre tema claro e escuro"
                  action={
                    <Switch
                      checked={isDark}
                      onChange={() => setIsDark(!isDark)}
                      color="primary"
                    />
                  }
                />
                <SettingItem
                  icon={LanguageIcon}
                  title="Idioma"
                  description="Português (Brasil)"
                  action={
                    <Chip label="PT-BR" size="small" variant="outlined" />
                  }
                  divider={false}
                />
              </SettingSection>

              {/* Notificações */}
              <SettingSection title="Notificações" icon={NotificationsIcon}>
                <SettingItem
                  icon={NotificationsIcon}
                  title="Notificações Push"
                  description="Receber alertas do sistema em tempo real"
                  action={
                    <Switch
                      checked={notificacoesAtivas}
                      onChange={() => setNotificacoesAtivas(!notificacoesAtivas)}
                      color="primary"
                    />
                  }
                />
                <SettingItem
                  icon={ShippingIcon}
                  title="Alertas de Estoque"
                  description="Avisar quando produtos estiverem com estoque baixo"
                  action={
                    <Switch
                      checked={alertasEstoque}
                      onChange={() => setAlertasEstoque(!alertasEstoque)}
                      color="primary"
                    />
                  }
                  divider={false}
                />
              </SettingSection>

              {/* Integrações */}
              <SettingSection title="Integrações e Sincronização" icon={SyncIcon}>
                <SettingItem
                  icon={SyncIcon}
                  title="Sincronização Automática"
                  description="Sincronizar dados com marketplaces automaticamente"
                  action={
                    <Switch
                      checked={sincronizacaoAuto}
                      onChange={() => setSincronizacaoAuto(!sincronizacaoAuto)}
                      color="primary"
                    />
                  }
                />
                <SettingItem
                  icon={StorageIcon}
                  title="Banco de Dados"
                  description="Supabase - Conectado"
                  action={
                    <Chip label="Online" size="small" color="success" sx={{ fontWeight: 600 }} />
                  }
                  divider={false}
                />
              </SettingSection>

              {/* Segurança */}
              <SettingSection title="Segurança" icon={SecurityIcon}>
                <SettingItem
                  icon={KeyIcon}
                  title="Alterar Senha"
                  description="Atualizar sua senha de acesso"
                  action={
                    <Button size="small" variant="outlined" sx={{ textTransform: 'none', borderRadius: '8px' }}>
                      Alterar
                    </Button>
                  }
                />
                <SettingItem
                  icon={SecurityIcon}
                  title="Encerrar Outras Sessões"
                  description="Desconectar todos os outros dispositivos"
                  action={
                    <Button size="small" variant="outlined" color="warning" sx={{ textTransform: 'none', borderRadius: '8px' }}>
                      Encerrar
                    </Button>
                  }
                  divider={false}
                />
              </SettingSection>
            </Grid>
          </Grid>

        </Container>
      </Box>

      {/* Dialog de Logout */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirmar Saída
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza de que deseja sair do sistema? Você será redirecionado para a tela de login.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            color="error"
            variant="contained"
            startIcon={<LogoutIcon />}
            sx={{ textTransform: 'none', borderRadius: '8px', boxShadow: 'none' }}
          >
            Sair
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Configuracoes;