'use client';

import { useState, createContext, ReactNode, useMemo } from 'react';
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

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo(
    () => ({
      toggleColorMode,
      setContrast,
      mode,
      contrast,
    }),
    [mode, contrast]
  );

  const theme = useMemo(
    () => createTheme(getDesignTokens(mode, contrast)),
    [mode, contrast]
  );

  return (
    <ColorModeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}
