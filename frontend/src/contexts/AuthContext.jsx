import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Credenciais válidas
  const VALID_CREDENTIALS = {
    login: 'Bruno',
    password: 'BrunoImportacao123'
  };

  // Verificar se o usuário já está logado ao carregar a aplicação
  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUser = localStorage.getItem('user');
    
    if (savedAuth === 'true' && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
    
    setLoading(false);
  }, []);

  const login = (loginData) => {
    const { login, password } = loginData;
    
    // Verificar credenciais
    if (login === VALID_CREDENTIALS.login && password === VALID_CREDENTIALS.password) {
      const userData = {
        login: login,
        name: 'Bruno',
        loginTime: new Date().toISOString()
      };
      
      setIsAuthenticated(true);
      setUser(userData);
      
      // Salvar no localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true };
    } else {
      return { 
        success: false, 
        error: 'Login ou senha incorretos' 
      };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    
    // Remover do localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};