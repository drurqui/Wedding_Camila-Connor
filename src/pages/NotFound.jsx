import React from 'react';
import { Box, Typography, Button, Container, Card } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Box 
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'background.default',
                p: 2
            }}
        >
            <Container maxWidth="sm">
                <Card 
                    sx={{ 
                        p: 6, 
                        textAlign: 'center', 
                        boxShadow: 3, 
                        borderRadius: 4,
                        borderTop: '6px solid',
                        borderColor: 'primary.main'
                    }}
                >
                    <Typography 
                        variant="h1" 
                        color="primary.main" 
                        sx={{ 
                            fontSize: { xs: '5rem', sm: '7rem' }, 
                            fontWeight: 'bold',
                            fontFamily: '"Playfair Display", serif'
                        }}
                    >
                        404
                    </Typography>
                    <Typography 
                        variant="h4" 
                        color="text.primary" 
                        sx={{ 
                            mb: 2, 
                            mt: 1,
                            fontFamily: '"Playfair Display", serif' 
                        }}
                    >
                        {t('notFound.title', 'Página no encontrada')}
                    </Typography>
                    <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ mb: 5 }}
                    >
                        {t('notFound.message', '¡Ups! La página que buscas no existe o ha sido movida.')}
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="large" 
                        onClick={() => navigate('/')}
                        sx={{ 
                            borderRadius: '30px', 
                            px: 5, 
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1.1rem'
                        }}
                    >
                        {t('notFound.button', 'Volver al Inicio')}
                    </Button>
                </Card>
            </Container>
        </Box>
    );
};

export default NotFound;
