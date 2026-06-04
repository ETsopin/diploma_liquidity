'use client';

import { useState, createContext, ReactNode, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getDesignTokens, ThemeMode, ContrastType } from '@/styles/theme/theme';

//
// THEME CONTEXT
//

interface ThemeContextType {
  toggleColorMode: () => void;
  setContrast: (contrast: ContrastType) => void;
  mode: ThemeMode;
  contrast: ContrastType;
}

export const ColorModeContext = createContext<ThemeContextType>({
  toggleColorMode: () => {},
  setContrast: () => {},
  mode: 'light',
  contrast: 'normal',
});

//
// THEME PROVIDER
//

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [contrast, setContrast] = useState<ContrastType>('normal');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    const savedContrast = localStorage.getItem('theme-contrast') as ContrastType;
    
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setMode(savedMode);
    }
    
    if (savedContrast && (savedContrast === 'normal' || savedContrast === 'medium' || savedContrast === 'high')) {
      setContrast(savedContrast);
    }
    
    setIsInitialized(true);
  }, []);

  const toggleColorMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-mode', newMode);
      return newMode;
    });
  };

  const handleSetContrast = (newContrast: ContrastType) => {
    setContrast(newContrast);
    localStorage.setItem('theme-contrast', newContrast);
  };

  const value = useMemo(
    () => ({
      toggleColorMode,
      setContrast: handleSetContrast,
      mode,
      contrast,
    }),
    [mode, contrast]
  );

  const theme = useMemo(
    () => createTheme(getDesignTokens(mode, contrast)),
    [mode, contrast]
  );

  if (!isInitialized) {
    return null;
  }

  return (
    <ColorModeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}
