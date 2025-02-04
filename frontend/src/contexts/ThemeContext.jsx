import React, { createContext, useContext, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';

const ThemeContext = createContext();

export function useAppTheme() {
  return useContext(ThemeContext);
}

// Exportando useTheme para manter compatibilidade
export const useTheme = useAppTheme;

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  const theme = createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#9c27b0',
      },
      success: {
        main: '#4caf50',
      },
      warning: {
        main: '#ff9800',
      },
      error: {
        main: '#f44336',
      },
      background: {
        default: isDark ? '#121212' : '#f5f5f5',
        paper: isDark ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 500,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
} 