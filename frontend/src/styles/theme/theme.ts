'use client'

import { createTheme, PaletteOptions } from '@mui/material/styles';

//
// TYPES
//

export type ContrastLevel = 'normal' | 'medium' | 'high';

declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
    surface: {
      main: string;
      light: string;
      dark: string;
      container: string;
      containerLow: string;
      containerHigh: string;
      containerLowest: string;
      dim: string;
      bright: string;
    };
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
    surface?: {
      main?: string;
      light?: string;
      dark?: string;
      container?: string;
      containerLow?: string;
      containerHigh?: string;
      containerLowest?: string;
      dim?: string;
      bright?: string;
    };
  }
}

//
// THEME PALLETES
//

const lightNormal: PalleteOptions  = {
  primary: {
    main: '#4C662B',
    light: '#CDEDA3',
    dark: '#354E16',
    contrastText: '#FFFFFF',
    onPrimary: '#FFFFFF',
    primaryContainer: '#CDEDA3',
    onPrimaryContainer: '#354E16',
    fixed: '#CDEDA3',
    fixedDim: '#B1D18A',
  },
  secondary: {
    main: '#586249',
    light: '#DCE7C8',
    dark: '#404A33',
    contrastText: '#FFFFFF',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DCE7C8',
    onSecondaryContainer: '#404A33',
    fixed: '#DCE7C8',
    fixedDim: '#BFCBAD',
  },
  tertiary: {
    main: '#386663',
    light: '#BCECE7',
    dark: '#1F4E4B',
    contrastText: '#FFFFFF',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#BCECE7',
    onTertiaryContainer: '#1F4E4B',
    fixed: '#BCECE7',
    fixedDim: '#A0D0CB',
  },
  error: {
    main: '#BA1A1A',
    light: '#FFDAD6',
    dark: '#93000A',
    contrastText: '#FFFFFF',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#93000A',
  },
  surface: {
    main: '#F9FAEF',
    light: '#FFFFFF',
    dark: '#1A1C16',
    container: '#EEEFE3',
    containerLow: '#F3F4E9',
    containerHigh: '#E8E9DE',
    containerLowest: '#FFFFFF',
    dim: '#DADBD0',
    bright: '#F9FAEF',
  },
  background: {
    default: '#F9FAEF',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1A1C16',
    secondary: '#44483D',
    disabled: '#75796C',
  },
  divider: '#C5C8BA',
  outline: '#75796C',
  outlineVariant: '#C5C8BA',
  action: {
    active: '#75796C',
    hover: '#E1E4D5',
    selected: '#CDEDA3',
    disabled: '#C5C8BA',
    disabledBackground: '#E1E4D5',
  },
  inverse: {
    surface: '#2F312A',
    onSurface: '#F1F2E6',
    primary: '#B1D18A',
  },
};

const lightMedium: PaletteOptions = {
  primary: {
    main: '#253D05',
    light: '#5A7539',
    dark: '#1F3701',
    contrastText: '#FFFFFF',
    onPrimary: '#FFFFFF',
    primaryContainer: '#5A7539',
    onPrimaryContainer: '#FFFFFF',
    fixed: '#5A7539',
    fixedDim: '#425C23',
  },
  secondary: {
    main: '#303924',
    light: '#667157',
    dark: '#1F280E',
    contrastText: '#FFFFFF',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#667157',
    onSecondaryContainer: '#FFFFFF',
    fixed: '#667157',
    fixedDim: '#4E5840',
  },
  tertiary: {
    main: '#083D3A',
    light: '#477572',
    dark: '#00201E',
    contrastText: '#FFFFFF',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#477572',
    onTertiaryContainer: '#FFFFFF',
    fixed: '#477572',
    fixedDim: '#2E5C59',
  },
  error: {
    main: '#740006',
    light: '#CF2C27',
    dark: '#410002',
    contrastText: '#FFFFFF',
    onError: '#FFFFFF',
    errorContainer: '#CF2C27',
    onErrorContainer: '#FFFFFF',
  },
  surface: {
    main: '#F9FAEF',
    light: '#FFFFFF',
    dark: '#0F120C',
    container: '#E8E9DE',
    containerLow: '#F3F4E9',
    containerHigh: '#DCDED3',
    containerLowest: '#FFFFFF',
    dim: '#C6C7BD',
    bright: '#F9FAEF',
  },
  background: {
    default: '#F9FAEF',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#0F120C',
    secondary: '#34382D',
    disabled: '#505449',
  },
  divider: '#6B6F62',
  outline: '#505449',
  outlineVariant: '#6B6F62',
  action: {
    active: '#505449',
    hover: '#E1E4D5',
    selected: '#CDEDA3',
  },
  inverse: {
    surface: '#2F312A',
    onSurface: '#F1F2E6',
    primary: '#B1D18A',
  },
};

const lightHigh: PaletteOptions = {
  primary: {
    main: '#1C3200',
    light: '#375018',
    dark: '#102000',
    contrastText: '#FFFFFF',
    onPrimary: '#FFFFFF',
    primaryContainer: '#375018',
    onPrimaryContainer: '#FFFFFF',
    fixed: '#375018',
    fixedDim: '#213903',
  },
  secondary: {
    main: '#262F1A',
    light: '#434C35',
    dark: '#151E0B',
    contrastText: '#FFFFFF',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#434C35',
    onSecondaryContainer: '#FFFFFF',
    fixed: '#434C35',
    fixedDim: '#2C3620',
  },
  tertiary: {
    main: '#003230',
    light: '#21504E',
    dark: '#00201E',
    contrastText: '#FFFFFF',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#21504E',
    onTertiaryContainer: '#FFFFFF',
    fixed: '#21504E',
    fixedDim: '#033937',
  },
  error: {
    main: '#600004',
    light: '#98000A',
    dark: '#410002',
    contrastText: '#FFFFFF',
    onError: '#FFFFFF',
    errorContainer: '#98000A',
    onErrorContainer: '#FFFFFF',
  },
  surface: {
    main: '#F9FAEF',
    light: '#FFFFFF',
    dark: '#000000',
    container: '#E2E3D8',
    containerLow: '#F1F2E6',
    containerHigh: '#D4D5CA',
    containerLowest: '#FFFFFF',
    dim: '#B8BAAF',
    bright: '#F9FAEF',
  },
  background: {
    default: '#F9FAEF',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#000000',
    secondary: '#2A2D24',
    disabled: '#474B40',
  },
  divider: '#474B40',
  outline: '#2A2D24',
  outlineVariant: '#474B40',
  action: {
    active: '#2A2D24',
    hover: '#E1E4D5',
    selected: '#CDEDA3',
  },
  inverse: {
    surface: '#2F312A',
    onSurface: '#FFFFFF',
    primary: '#B1D18A',
  },
};

const darkNormal: PaletteOptions = {
  primary: {
    main: '#B1D18A',
    light: '#CDEDA3',
    dark: '#354E16',
    contrastText: '#1F3701',
    onPrimary: '#1F3701',
    primaryContainer: '#354E16',
    onPrimaryContainer: '#CDEDA3',
    fixed: '#CDEDA3',
    fixedDim: '#B1D18A',
  },
  secondary: {
    main: '#BFCBAD',
    light: '#DCE7C8',
    dark: '#404A33',
    contrastText: '#2A331E',
    onSecondary: '#2A331E',
    secondaryContainer: '#404A33',
    onSecondaryContainer: '#DCE7C8',
    fixed: '#DCE7C8',
    fixedDim: '#BFCBAD',
  },
  tertiary: {
    main: '#A0D0CB',
    light: '#BCECE7',
    dark: '#1F4E4B',
    contrastText: '#003735',
    onTertiary: '#003735',
    tertiaryContainer: '#1F4E4B',
    onTertiaryContainer: '#BCECE7',
    fixed: '#BCECE7',
    fixedDim: '#A0D0CB',
  },
  error: {
    main: '#FFB4AB',
    light: '#FFDAD6',
    dark: '#93000A',
    contrastText: '#690005',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
  },
  surface: {
    main: '#12140E',
    light: '#383A32',
    dark: '#E2E3D8',
    container: '#1E201A',
    containerLow: '#1A1C16',
    containerHigh: '#282B24',
    containerLowest: '#0C0F09',
    dim: '#12140E',
    bright: '#383A32',
  },
  background: {
    default: '#12140E',
    paper: '#1E201A',
  },
  text: {
    primary: '#E2E3D8',
    secondary: '#C5C8BA',
    disabled: '#8F9285',
  },
  divider: '#44483D',
  outline: '#8F9285',
  outlineVariant: '#44483D',
  action: {
    active: '#8F9285',
    hover: '#44483D',
    selected: '#354E16',
    disabled: '#44483D',
    disabledBackground: '#282B24',
  },
  inverse: {
    surface: '#E2E3D8',
    onSurface: '#2F312A',
    primary: '#4C662B',
  },
};

const darkMedium: PaletteOptions = {
  primary: {
    main: '#C7E79E',
    light: '#7D9A59',
    dark: '#354E16',
    contrastText: '#172B00',
    onPrimary: '#172B00',
    primaryContainer: '#7D9A59',
    onPrimaryContainer: '#000000',
    fixed: '#7D9A59',
    fixedDim: '#5A7539',
  },
  secondary: {
    main: '#D5E1C2',
    light: '#8A9579',
    dark: '#404A33',
    contrastText: '#1F2814',
    onSecondary: '#1F2814',
    secondaryContainer: '#8A9579',
    onSecondaryContainer: '#000000',
    fixed: '#8A9579',
    fixedDim: '#667157',
  },
  tertiary: {
    main: '#B5E6E1',
    light: '#6B9995',
    dark: '#1F4E4B',
    contrastText: '#002B29',
    onTertiary: '#002B29',
    tertiaryContainer: '#6B9995',
    onTertiaryContainer: '#000000',
    fixed: '#6B9995',
    fixedDim: '#477572',
  },
  error: {
    main: '#FFD2CC',
    light: '#FF5449',
    dark: '#93000A',
    contrastText: '#540003',
    onError: '#540003',
    errorContainer: '#FF5449',
    onErrorContainer: '#000000',
  },
  surface: {
    main: '#12140E',
    light: '#43453D',
    dark: '#FFFFFF',
    container: '#262922',
    containerLow: '#1C1E18',
    containerHigh: '#31342C',
    containerLowest: '#060804',
    dim: '#12140E',
    bright: '#43453D',
  },
  background: {
    default: '#12140E',
    paper: '#1E201A',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#DBDECF',
    disabled: '#B0B3A6',
  },
  divider: '#8E9285',
  outline: '#B0B3A6',
  outlineVariant: '#8E9285',
  action: {
    active: '#B0B3A6',
    hover: '#44483D',
    selected: '#354E16',
  },
  inverse: {
    surface: '#E2E3D8',
    onSurface: '#282B24',
    primary: '#364F17',
  },
};

const darkHigh: PaletteOptions = {
  primary: {
    main: '#DAFBB0',
    light: '#ADCD86',
    dark: '#354E16',
    contrastText: '#000000',
    onPrimary: '#000000',
    primaryContainer: '#ADCD86',
    onPrimaryContainer: '#050E00',
    fixed: '#ADCD86',
    fixedDim: '#7D9A59',
  },
  secondary: {
    main: '#E9F4D5',
    light: '#BCC7A9',
    dark: '#404A33',
    contrastText: '#000000',
    onSecondary: '#000000',
    secondaryContainer: '#BCC7A9',
    onSecondaryContainer: '#060D01',
    fixed: '#BCC7A9',
    fixedDim: '#8A9579',
  },
  tertiary: {
    main: '#C9F9F5',
    light: '#9CCCC7',
    dark: '#1F4E4B',
    contrastText: '#000000',
    onTertiary: '#000000',
    tertiaryContainer: '#9CCCC7',
    onTertiaryContainer: '#000E0D',
    fixed: '#9CCCC7',
    fixedDim: '#6B9995',
  },
  error: {
    main: '#FFECE9',
    light: '#FFAEA4',
    dark: '#93000A',
    contrastText: '#000000',
    onError: '#000000',
    errorContainer: '#FFAEA4',
    onErrorContainer: '#220001',
  },
  surface: {
    main: '#12140E',
    light: '#4F5149',
    dark: '#FFFFFF',
    container: '#2F312A',
    containerLow: '#1E201A',
    containerHigh: '#3A3C35',
    containerLowest: '#000000',
    dim: '#12140E',
    bright: '#4F5149',
  },
  background: {
    default: '#12140E',
    paper: '#1E201A',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#EEF2E2',
    disabled: '#C1C4B6',
  },
  divider: '#C1C4B6',
  outline: '#EEF2E2',
  outlineVariant: '#C1C4B6',
  action: {
    active: '#EEF2E2',
    hover: '#44483D',
    selected: '#354E16',
  },
  inverse: {
    surface: '#E2E3D8',
    onSurface: '#000000',
    primary: '#364F17',
  },
};

//
// THEME FUNCTIONS
//

export type ThemeMode = 'light' | 'dark';
export type ContrastType = 'normal' | 'medium' | 'high';

export const getPalette = (mode: ThemeMode, contrast: ContrastType = 'normal'): PaletteOptions => {
  if (mode === 'light') {
    switch (contrast) {
      case 'medium':
        return lightMedium;
      case 'high':
        return lightHigh;
      default:
        return lightNormal;
    }
  } else {
    switch (contrast) {
      case 'medium':
        return darkMedium;
      case 'high':
        return darkHigh;
      default:
        return darkNormal;
    }
  }
};

export const getDesignTokens = (mode: ThemeMode, contrast: ContrastType = 'normal') => {
  const palette = getPalette(mode, contrast);
  
  return {
    palette,
    typography: {
      fontFamily: '"Inter Variable", "Inter Tight Variable", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 600 },
      h2: { fontSize: '2rem', fontWeight: 600 },
      h3: { fontSize: '1.75rem', fontWeight: 600 },
      h4: { fontSize: '1.5rem', fontWeight: 500 },
      h5: { fontSize: '1.25rem', fontWeight: 500 },
      h6: { fontSize: '1rem', fontWeight: 500 },
      body1: { fontSize: '1rem', fontWeight: 400 },
      body2: { fontSize: '0.875rem', fontWeight: 400 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 8 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.surface?.container,
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.surface?.main,
          }),
        },
      },
    },
  };
};

// Default Theme
const theme = createTheme(getDesignTokens('light', 'normal'));

export default theme;
