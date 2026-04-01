import { Box, Container, Typography, AppBar, Toolbar, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user, logout } = useAuth();

  return (
    <Box>
      <AppBar position="static" color="transparent" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary">Panel de Novios</Typography>
          <Button color="error" variant="outlined" size="small" onClick={logout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" color="secondary" sx={{ textAlign: 'center', mb: 1, fontFamily: "'Playfair Display', serif" }}>
          Administración de la Boda
        </Typography>
        <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
          Sesión activa: {user?.email}
        </Typography>
        
        <Typography variant="body1">Aquí construiremos las tablas...</Typography>
      </Container>
    </Box>
  );
};

export default Admin;