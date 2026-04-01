import { Box, Container, Typography, Card, TextField, Button } from '@mui/material';

const Home = () => {
  return (
    <Box>
      <Box sx={{ height: '60vh', backgroundColor: '#711c2e', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
        <Typography variant="h1" sx={{ fontSize: '5rem' }}>Shields Urquilla</Typography>
        <Typography variant="h6">CELEBRACIÓN DE COMPROMISO</Typography>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -5 }}>
        <Card sx={{ p: 4, textAlign: 'center', boxShadow: 3 }}>
          <Typography variant="h5" color="secondary" gutterBottom>¡Bienvenidos!</Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>Por favor, identifícate para confirmar tu asistencia.</Typography>
          
          <TextField fullWidth label="Tu Nombre y Apellidos" variant="outlined" margin="normal" />
          <TextField fullWidth label="Tu Correo Electrónico" variant="outlined" margin="normal" />
          
          <Button fullWidth variant="contained" sx={{ mt: 2, borderRadius: 10, bgcolor: '#d4af37' }}>
            Entrar a la Invitación
          </Button>
        </Card>
      </Container>
    </Box>
  );
};

export default Home;