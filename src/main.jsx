import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// INICIALIZADOR DE IDIOMA
import './config/i18n'; 

// Definimos el tema visual EXACTO de tu boda
const theme = createTheme({
  palette: {
    primary: {
      main: '#711c2e', // Vino
    },
    secondary: {
      main: '#dabc60', // Oro
    },
    background: {
      default: '#fdfbf7', // Fondo crema
      paper: '#ffffff',     // Fondo blanco para tarjetas
    },
    text: {
      primary: '#5a3b45',
      secondary: '#888888', // Gris más claro para los subtítulos
    }
  },
  typography: {
    fontFamily: "'Montserrat', sans-serif",
    h1: {
      fontFamily: "'Monsieur La Doulaise', cursive",
      fontWeight: 400,
    },
    h2: {
      fontFamily: "'Monsieur La Doulaise', cursive",
      fontWeight: 400,
    },
    h3: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 400,
    },
    h4: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 400,
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.85rem',
      fontWeight: 300,
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          textTransform: 'uppercase',
          fontWeight: 500,
          letterSpacing: '1px',
          boxShadow: 'none',
          padding: '12px 24px',
          '&:hover': {
            boxShadow: 'none',
          }
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: '#ffffff',
          '& fieldset': {
            borderColor: '#e8e8e8',
          },
          '&:hover fieldset': {
            borderColor: '#dabc60 !important',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#711c2e !important', // Borde vino al hacer clic
          }
        }
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);