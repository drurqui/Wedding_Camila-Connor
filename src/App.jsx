// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Wedding from './pages/Wedding';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import { Box, Button, Typography, Container, Card } from '@mui/material';
import { useTranslation } from 'react-i18next';

// Configuración del evento predeterminado en la raíz (/):
// 'engagement' actualmente; cuando concluya el compromiso, cambiar a 'wedding'.
const ACTIVE_EVENT = 'engagement';

// Componente guardián: si no hay usuario, lo patea al login
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/admin/login" />;
    return children;
};

// Pantalla de Login de Admin diseñada con MUI
const AdminLogin = () => {
    const { user, login } = useAuth();
    const { t } = useTranslation();
    
    // Si ya está logueado, lo mandamos directo al dashboard
    if (user) return <Navigate to="/admin" />;
    
    return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
            <Card sx={{ p: 5, textAlign: 'center', boxShadow: 3, borderRadius: 3 }}>
                <Typography variant="h2" color="primary" gutterBottom>{t('adminLogin.title')}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    {t('adminLogin.subtitle')}
                </Typography>
                <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={login}
                    size="large"
                    sx={{ borderRadius: 10, px: 4 }}
                >
                    {t('adminLogin.button')}
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
                    {/* Ruta pública raíz: muestra el evento activo configurado */}
                    <Route path="/" element={ACTIVE_EVENT === 'engagement' ? <Home /> : <Wedding />} />
                    
                    {/* Rutas explícitas de Engagement (EN, ES, FR) */}
                    <Route path="/engagement" element={<Home />} />
                    <Route path="/compromiso" element={<Home />} />
                    <Route path="/fiancailles" element={<Home />} />
                    
                    {/* Rutas explícitas de Wedding (EN, ES, FR) */}
                    <Route path="/wedding" element={<Wedding />} />
                    <Route path="/boda" element={<Wedding />} />
                    <Route path="/mariage" element={<Wedding />} />
                    
                    {/* Rutas de Políticas de Privacidad y Términos de Uso */}
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/privacidad" element={<PrivacyPolicy />} />
                    <Route path="/confidentialite" element={<PrivacyPolicy />} />
                    
                    <Route path="/terms" element={<TermsOfUse />} />
                    <Route path="/terminos" element={<TermsOfUse />} />
                    <Route path="/conditions" element={<TermsOfUse />} />

                    {/* Rutas privadas para administradores */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={
                        <ProtectedRoute>
                            <Admin />
                        </ProtectedRoute>
                    } />

                    {/* Ruta 404 (catch-all) */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;