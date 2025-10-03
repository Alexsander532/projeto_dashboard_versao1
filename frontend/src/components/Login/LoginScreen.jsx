import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Avatar,
  Card,
  CardContent,
  Fade,
  Slide,
  Paper,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginScreen = () => {
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = login(formData);
      
      if (result.success) {
        // Redirecionar para a página do Mercado Livre após login bem-sucedido
        navigate('/mercado-livre');
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes float {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
            100% {
              transform: translateY(0px);
            }
          }
          
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #667eea 75%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            top: '70%',
            right: '15%',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: '5%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            animation: 'float 7s ease-in-out infinite'
          }}
        />
        
        {/* Additional floating elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            right: '5%',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(8px)',
            animation: 'float 5s ease-in-out infinite'
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '3%',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(6px)',
            animation: 'float 9s ease-in-out infinite reverse'
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            top: '15%',
            right: '25%',
            width: 25,
            height: 25,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(4px)',
            animation: 'float 4s ease-in-out infinite'
          }}
        />

        {/* Left side - Branding */}
        <Box
          sx={{
            flex: { xs: 0, md: 0.4 },
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 4,
            color: 'white',
            position: 'relative',
            zIndex: 1
          }}
        >
          <Fade in timeout={1000}>
            <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <BusinessIcon sx={{ fontSize: 80, opacity: 0.9 }} />
              </Box>
              
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  marginBottom: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                Sistema de Gestão
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  marginBottom: 4,
                  opacity: 0.9,
                  lineHeight: 1.6
                }}
              >
                Gerencie suas vendas do Mercado Livre e Magazine Luiza de forma integrada e eficiente
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <Chip 
                  icon={<DashboardIcon />} 
                  label="Dashboard Completo" 
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }} 
                />
                <Chip 
                  icon={<SecurityIcon />} 
                  label="Acesso Seguro" 
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }} 
                />
              </Box>
            </Box>
          </Fade>
        </Box>

        {/* Right side - Login Form */}
        <Box
          sx={{
            flex: { xs: 1, md: 0.6 },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: { xs: 2, sm: 4 },
            position: 'relative',
            zIndex: 1
          }}
        >
          <Slide direction="left" in timeout={800}>
            <Card
              sx={{
                width: '100%',
                maxWidth: 450,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                borderRadius: 4,
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
              }}
            >
              <CardContent sx={{ padding: 4 }}>
                <Fade in timeout={1200}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginBottom: 4
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        marginBottom: 3
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                          border: '3px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <DashboardIcon sx={{ fontSize: 40, color: 'white' }} />
                      </Avatar>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          width: 90,
                          height: 90,
                          borderRadius: '50%',
                          border: '2px solid rgba(102, 126, 234, 0.3)',
                          animation: 'pulse 2s infinite'
                        }}
                      />
                    </Box>
                    
                    <Typography
                      component="h1"
                      variant="h4"
                      sx={{
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 1
                      }}
                    >
                      Dashboard
                    </Typography>
                    
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      align="center"
                      sx={{ fontWeight: 500 }}
                    >
                      Faça login para acessar o sistema
                    </Typography>
                    
                    <Divider sx={{ width: '60%', mt: 2, mb: 1 }} />
                    
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                    >
                      Sistema de Gestão de Vendas
                    </Typography>
                  </Box>
                </Fade>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ marginBottom: 2 }}
                    onClose={() => setError('')}
                  >
                    {error}
                  </Alert>
                )}

                <Slide direction="up" in timeout={800}>
                  <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="login"
                      label="Login"
                      name="login"
                      autoComplete="username"
                      autoFocus
                      value={formData.login}
                      onChange={handleChange}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#667eea' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        marginBottom: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 500
                        }
                      }}
                    />
                    
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Senha"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: '#667eea' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                              disabled={loading}
                              sx={{
                                color: '#667eea',
                                '&:hover': {
                                  backgroundColor: 'rgba(102, 126, 234, 0.1)'
                                }
                              }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        marginBottom: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 500
                        }
                      }}
                    />
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{
                        mt: 2,
                        mb: 2,
                        py: 1.8,
                        borderRadius: 3,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
                          background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                        },
                        '&:active': {
                          transform: 'translateY(0px)'
                        },
                        '&:disabled': {
                          background: 'linear-gradient(135deg, #a0aec0 0%, #718096 100%)',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={20} color="inherit" />
                          <Typography variant="body2">Entrando...</Typography>
                        </Box>
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </Box>
                </Slide>

                <Fade in timeout={1600}>
                  <Paper
                    elevation={0}
                    sx={{
                      marginTop: 3,
                      padding: 3,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.1)',
                      borderRadius: 3,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <SecurityIcon sx={{ color: '#667eea', mr: 1, fontSize: 20 }} />
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: '#667eea'
                        }}
                      >
                        Credenciais de Demonstração
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ mb: 2, borderColor: 'rgba(102, 126, 234, 0.2)' }} />
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Login:
                        </Typography>
                        <Chip 
                          label="Bruno" 
                          size="small" 
                          sx={{ 
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            color: '#667eea',
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }} 
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Senha:
                        </Typography>
                        <Chip 
                          label="@nodemongodb123" 
                          size="small" 
                          sx={{ 
                            backgroundColor: 'rgba(118, 75, 162, 0.1)',
                            color: '#764ba2',
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }} 
                        />
                      </Box>
                    </Box>
                    
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      align="center" 
                      sx={{ 
                        display: 'block',
                        mt: 2,
                        fontStyle: 'italic',
                        opacity: 0.8
                      }}
                    >
                      Use essas credenciais para acessar o sistema
                    </Typography>
                  </Paper>
                </Fade>
              </CardContent>
            </Card>
          </Slide>
        </Box>
      </Box>
    </>
  );
};

export default LoginScreen;