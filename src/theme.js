// src/theme.js
import { createTheme } from '@mui/material/styles';

// RIT brand colors
const ritOrange = '#F76902'; // RIT Primary Orange
const ritBrown = '#513127';  // Complementary to the brick buildings
const ritWhite = '#FFFFFF';
const ritGray = '#E6E6E6';
const ritDarkGray = '#333333';

const theme = createTheme({
  palette: {
    primary: {
      main: ritOrange,
      light: '#FF8A33',
      dark: '#D45500',
      contrastText: ritWhite,
    },
    secondary: {
      main: ritBrown,
      light: '#6E4639',
      dark: '#3B241C',
      contrastText: ritWhite,
    },
    background: {
      default: ritWhite,
      paper: ritWhite,
    },
    text: {
      primary: ritDarkGray,
      secondary: '#555555',
    },
    success: {
      main: '#4CAF50',
    },
    info: {
      main: '#2196F3',
    },
    error: {
      main: '#F44336',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none', // Avoid all-caps in buttons for better readability
    },
  },
  shape: {
    borderRadius: 4, // More conservative border radius for professional look
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 16px',
          fontWeight: 500,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default theme;