import { createTheme } from '@mui/material/styles';

// Loka design tokens
const LOKA_BLACK = '#001A16';
const LOKA_WHITE = '#F1FFFD';
const LOKA_PRIMARY = '#009D85';

export const theme = createTheme({
  palette: {
    primary: {
      main: LOKA_PRIMARY,
      contrastText: LOKA_WHITE,
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    background: {
      // use Loka white as the app background
      default: LOKA_WHITE,
      paper: LOKA_WHITE,
    },
    text: {
      // default text color on non-primary backgrounds
      primary: LOKA_BLACK,
      secondary: 'rgba(0, 0, 0, 0.6)',
      // note: on primary backgrounds, use `palette.primary.contrastText` (LOKA_WHITE)
    },
    common: {
      black: LOKA_BLACK,
      white: LOKA_WHITE,
    },
  },
  typography: {
    fontFamily: [
      'Nunito',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 800,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 800,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 800,
      fontSize: '1.25rem',
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
          fontSize: '0.9375rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
