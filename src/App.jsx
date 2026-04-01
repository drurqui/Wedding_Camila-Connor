// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Admin from './pages/Admin';
import { Box, Button, Typography, Container, Card } from '@mui/material';

// Componente guardián: si no hay usuario, lo patea al login
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/admin/login" />;
    return children;
};

// Pantalla de Login de Admin diseñada con MUI
const AdminLogin = () => {
    const { user, login } = useAuth();
    
    // Si ya está logueado, lo mandamos directo al dashboard
    if (user) return <Navigate to="/admin" />;
    
    return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
            <Card sx={{ p: 5, textAlign: 'center', boxShadow: 3, borderRadius: 3 }}>
                <Typography variant="h2" color="primary" gutterBottom>Acceso Privado</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Panel exclusivo para la administración de la boda.
                </Typography>
                <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={login}
                    size="large"
                    sx={{ borderRadius: 10, px: 4 }}
                >
                    Entrar con Google
                </Button>
            </Card>
        </Container>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Ruta pública para los invitados */}
                    <Route path="/" element={<Home />} />
                    
                    {/* Rutas privadas para ustedes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={
                        <ProtectedRoute>
                            <Admin />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;