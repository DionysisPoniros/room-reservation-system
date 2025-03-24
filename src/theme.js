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
    MuiCssBaseline: {
      styleOverrides: `
        @keyframes shimmer {
          0% {
            background-position: -468px 0;
          }
          100% {
            background-position: 468px 0;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .skeleton-loader {
          background: linear-gradient(to right, #f6f7f8 8%, #edeef1 18%, #f6f7f8 33%);
          background-size: 800px 104px;
          animation: shimmer 1.5s infinite linear;
          position: relative;
          border-radius: 4px;
        }
        
        .skeleton-card {
          height: 200px;
          width: 100%;
          margin-bottom: 16px;
        }
        
        .skeleton-text {
          height: 16px;
          width: 80%;
          margin-bottom: 8px;
        }
        
        .skeleton-text-short {
          height: 16px;
          width: 60%;
          margin-bottom: 8px;
        }
        
        .loading-container {
          position: relative;
          min-height: 200px;
        }
        
        .fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        .MuiLinearProgress-root {
          height: 4px !important;
          border-radius: 2px !important;
        }
        
        .MuiCircularProgress-colorPrimary {
          color: ${ritOrange} !important;
        }
      `,
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 4,
          borderRadius: 2
        },
        bar: {
          borderRadius: 2
        }
      }
    },
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: {
          color: ritOrange
        }
      }
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: '#f0f0f0'
        },
        rectangular: {
          borderRadius: 4
        }
      }
    },
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