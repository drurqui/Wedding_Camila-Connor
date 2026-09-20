import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Card, TextField, Button, Grid, Chip, 
  Divider, Dialog, DialogTitle, DialogContent, DialogActions, 
  CircularProgress, Alert, Snackbar, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel 
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

const Wedding = () => {
  const { t, i18n } = useTranslation();

  // Estados para modal de regalo / Stripe
  const [checkoutModal, setCheckoutModal] = useState({
    open: false,
    itemKey: '',
    title: '',
    unitUsd: 100,
    unitCad: 135,
    isCustom: false,
  });

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    moneda: 'usd',
    cantidad: 1,
    montoLibre: 100,
  });

  const [loadingPayment, setLoadingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Manejo de respuesta de Stripe en la URL (?pago=exito o ?pago=cancelado)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pago') === 'exito') {
      setToast({
        open: true,
        message: i18n.language.startsWith('en') 
          ? "Thank you so much for contributing to our Honeymoon! ❤️✈️" 
          : i18n.language.startsWith('fr')
          ? "Merci infiniment pour votre participation à notre lune de miel ! ❤️✈️"
          : "¡Muchísimas gracias por tu contribución a nuestra luna de miel! ❤️✈️",
        severity: 'success'
      });
      window.history.replaceState(null, null, window.location.pathname);
    } else if (params.get('pago') === 'cancelado') {
      setToast({
        open: true,
        message: i18n.language.startsWith('en') 
          ? "Payment was cancelled. No charges were made." 
          : i18n.language.startsWith('fr')
          ? "Le paiement a été annulé. Aucun débit n'a été effectué."
          : "El pago fue cancelado. No se ha realizado ningún cobro.",
        severity: 'info'
      });
      window.history.replaceState(null, null, window.location.pathname);
    }
  }, [i18n.language]);

  const toggleLanguage = () => {
    const currentLang = i18n.language.substring(0, 2);
    let nextLang = 'es';
    if (currentLang === 'es') nextLang = 'en';
    else if (currentLang === 'en') nextLang = 'fr';
    else if (currentLang === 'fr') nextLang = 'es';
    i18n.changeLanguage(nextLang);
  };

  const handleOpenGiftModal = (key, item) => {
    setErrorMessage('');
    setFormData({
      nombre: '',
      email: '',
      moneda: 'usd',
      cantidad: 1,
      montoLibre: 100,
    });
    setCheckoutModal({
      open: true,
      itemKey: key,
      title: item.title,
      unitUsd: item.shareUsd,
      unitCad: item.shareCad,
      isCustom: false,
    });
  };

  const handleOpenCustomModal = () => {
    setErrorMessage('');
    setFormData({
      nombre: '',
      email: '',
      moneda: 'usd',
      cantidad: 1,
      montoLibre: 50,
    });
    setCheckoutModal({
      open: true,
      itemKey: 'custom',
      title: t('wedding.honeymoon.customContribution.title'),
      unitUsd: 50,
      unitCad: 68,
      isCustom: true,
    });
  };

  const handleProcessPayment = async () => {
    if (!formData.nombre.trim()) {
      setErrorMessage(t('wedding.honeymoon.modal.errors.nameRequired'));
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage(t('wedding.honeymoon.modal.errors.emailRequired'));
      return;
    }

    const unitPrice = formData.moneda === 'cad' ? checkoutModal.unitCad : checkoutModal.unitUsd;
    const finalAmount = checkoutModal.isCustom ? parseInt(formData.montoLibre) : unitPrice;

    if (isNaN(finalAmount) || finalAmount < 5) {
      setErrorMessage(t('wedding.honeymoon.modal.errors.minAmount'));
      return;
    }

    setLoadingPayment(true);
    setErrorMessage('');

    // URL del backend (Cloud Run en producción o fallback local)
    const backendBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8080'
      : 'https://api-boda-126620588755.us-central1.run.app';

    try {
      const response = await fetch(`${backendBase}/crear-sesion-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_regalo: checkoutModal.title,
          monto: finalAmount,
          moneda: formData.moneda,
          cantidad: checkoutModal.isCustom ? 1 : Math.max(1, formData.cantidad),
          url_origen: window.location.origin + window.location.pathname,
          nombre_invitado: formData.nombre.trim(),
          email_invitado: formData.email.trim(),
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.detail || data.error || 'Error al conectar con la pasarela de pagos.');
        setLoadingPayment(false);
      }
    } catch (err) {
      console.error("Error Stripe:", err);
      setErrorMessage("No se pudo contactar el servidor de pagos. Por favor intenta de nuevo en unos momentos.");
      setLoadingPayment(false);
    }
  };

  // Paleta de colores basada en el Canva de la novia
  const colors = {
    forestGreen: '#2b4334',
    forestDark: '#1d2f24',
    sandBeige: '#f5ebd7',
    sandLight: '#faf5eb',
    terracotta: '#b85d38',
    terracottaDark: '#984a2a',
    goldAccent: '#d4af37',
    charcoal: '#222222',
    creamText: '#f5ebd7',
  };

  return (
    <Box sx={{ bgcolor: colors.sandLight, minHeight: '100vh', color: colors.charcoal, overflowX: 'hidden' }}>
      
      {/* Botones Flotantes Superiores */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 100, display: 'flex', gap: 1 }}>
        <Button 
          variant="contained" 
          onClick={toggleLanguage} 
          sx={{ 
            borderRadius: '20px', 
            bgcolor: colors.terracotta, 
            color: '#fff', 
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            '&:hover': { bgcolor: colors.terracottaDark } 
          }}
        >
          {i18n.language.startsWith('es') ? 'EN' : i18n.language.startsWith('en') ? 'FR' : 'ES'}
        </Button>
      </Box>

      {/* Banner de acceso al Engagement */}
      <Box sx={{ bgcolor: colors.forestDark, py: 1, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: colors.goldAccent, letterSpacing: 1.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
          {t('wedding.nav.engagementLink')}:{' '}
          <RouterLink to="/engagement" style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 600 }}>
            {i18n.language.startsWith('en') ? 'View Engagement Party' : i18n.language.startsWith('fr') ? 'Voir les Fiançailles' : 'Ver Fiesta de Compromiso'}
          </RouterLink>
        </Typography>
      </Box>

      {/* HERO SECTION DE LA BODA */}
      <Box 
        sx={{ 
          minHeight: '75vh', 
          backgroundImage: `linear-gradient(rgba(29, 47, 36, 0.7), rgba(29, 47, 36, 0.85)), url('/foret_venue.jpg')`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          color: 'white', 
          px: 3, 
          py: 8,
          textAlign: 'center' 
        }}
      >
        {/* Monograma de la novia */}
        <Box 
          component="img" 
          src="/cs-monogram.jpg" 
          alt="Camila & Connor Monogram" 
          sx={{ 
            width: { xs: 90, sm: 120 }, 
            height: { xs: 90, sm: 120 }, 
            borderRadius: '50%', 
            objectFit: 'cover',
            mb: 3,
            p: 0.5,
            bgcolor: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            border: `2px solid ${colors.goldAccent}`
          }} 
        />
        <Typography 
          sx={{ 
            letterSpacing: 4, 
            fontSize: { xs: '0.85rem', sm: '1.1rem' }, 
            color: colors.goldAccent, 
            fontWeight: 500,
            textTransform: 'uppercase',
            mb: 1
          }}
        >
          {t('wedding.hero.subtitle')}
        </Typography>
        <Typography 
          variant="h1" 
          sx={{ 
            fontFamily: "'Playfair Display', serif", 
            fontSize: 'clamp(3.5rem, 9vw, 6.5rem)', 
            fontWeight: 400,
            lineHeight: 1.1, 
            color: '#ffffff',
            mb: 2
          }}
        >
          {t('wedding.hero.title')}
        </Typography>
        <Typography 
          variant="h4" 
          sx={{ 
            fontFamily: "'Playfair Display', serif", 
            color: colors.sandBeige, 
            fontSize: { xs: '1.2rem', sm: '1.8rem' },
            fontStyle: 'italic',
            mb: 1
          }}
        >
          {t('wedding.hero.date')}
        </Typography>
        <Typography 
          sx={{ 
            color: 'rgba(255,255,255,0.85)', 
            letterSpacing: 2, 
            fontSize: { xs: '0.85rem', sm: '1rem' } 
          }}
        >
          {t('wedding.hero.venue')}
        </Typography>

        {/* Quick Nav Links */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mt: 4 }}>
          <Button 
            variant="outlined" 
            href="#honeymoon" 
            sx={{ color: colors.sandBeige, borderColor: colors.goldAccent, borderRadius: '30px', px: 3 }}
          >
            {t('wedding.nav.honeymoon')}
          </Button>
          <Button 
            variant="outlined" 
            href="#logistics" 
            sx={{ color: colors.sandBeige, borderColor: colors.goldAccent, borderRadius: '30px', px: 3 }}
          >
            {t('wedding.nav.logistics')}
          </Button>
          <Button 
            variant="outlined" 
            href="#details" 
            sx={{ color: colors.sandBeige, borderColor: colors.goldAccent, borderRadius: '30px', px: 3 }}
          >
            {t('wedding.nav.details')}
          </Button>
        </Box>
      </Box>

      {/* SECCIÓN 1: THE HONEYMOON FUND (Diseño Verde y Crema de Canva) */}
      <Box id="honeymoon" sx={{ bgcolor: colors.forestGreen, color: colors.creamText, pt: 8, pb: 4, px: 3 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          {/* Logo o Icono CS */}
          <Box 
            component="img" 
            src="/cs-monogram.jpg" 
            alt="CS Monogram" 
            sx={{ 
              width: 65, 
              height: 65, 
              borderRadius: '50%', 
              mx: 'auto', 
              mb: 2,
              filter: 'brightness(1.05)'
            }} 
          />
          <Typography 
            variant="h2" 
            sx={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: { xs: '2.5rem', md: '3.8rem' }, 
              color: colors.sandBeige, 
              letterSpacing: 2,
              fontWeight: 400,
              textTransform: 'uppercase',
              mb: 1 
            }}
          >
            {t('wedding.honeymoon.title')}
          </Typography>
          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: "'Monsieur La Doulaise', cursive", 
              fontSize: { xs: '3rem', md: '4rem' }, 
              color: colors.goldAccent,
              mt: -2,
              mb: 3
            }}
          >
            Fund
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(245, 235, 215, 0.9)', 
              fontSize: { xs: '0.95rem', md: '1.05rem' }, 
              lineHeight: 1.8, 
              maxWidth: 700, 
              mx: 'auto',
              mb: 4
            }}
          >
            {t('wedding.honeymoon.description')}
          </Typography>
        </Container>
      </Box>

      {/* TARJETAS DE REGALOS (Fondo Beige cálido, estilo Canva) */}
      <Box sx={{ bgcolor: colors.sandBeige, py: 8, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="md">
          
          {/* Item 1: AIRFARE */}
          <Card 
            sx={{ 
              bgcolor: 'transparent', 
              boxShadow: 'none', 
              borderRadius: 0, 
              borderBottom: `1px solid rgba(184, 93, 56, 0.3)`, 
              pb: 6, 
              mb: 6 
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontFamily: "'Playfair Display', serif", 
                    color: colors.terracotta, 
                    fontSize: { xs: '2.2rem', md: '2.8rem' }, 
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    mb: 2,
                    display: { xs: 'block', sm: 'none' }
                  }}
                >
                  {t('wedding.honeymoon.items.airfare.title')}
                </Typography>
                <Box 
                  component="img" 
                  src="/airfare.jpg" 
                  alt="Airfare Flights" 
                  sx={{ width: '100%', borderRadius: '6px', height: 260, objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontFamily: "'Playfair Display', serif", 
                    color: colors.terracotta, 
                    fontSize: { xs: '2.2rem', md: '2.8rem' }, 
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    mb: 2,
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {t('wedding.honeymoon.items.airfare.title')}
                </Typography>
                <Typography 
                  sx={{ 
                    color: colors.charcoal, 
                    fontSize: '0.85rem', 
                    letterSpacing: 1.5, 
                    lineHeight: 1.7, 
                    textTransform: 'uppercase', 
                    mb: 3, 
                    fontWeight: 500 
                  }}
                >
                  {t('wedding.honeymoon.items.airfare.description')}
                </Typography>
                <Typography 
                  sx={{ 
                    color: colors.terracotta, 
                    fontWeight: 700, 
                    letterSpacing: 1.5, 
                    fontSize: '0.95rem', 
                    mb: 2 
                  }}
                >
                  {t('wedding.honeymoon.items.airfare.shareText')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="caption" sx={{ letterSpacing: 1.5, fontWeight: 600, color: '#666' }}>
                    HAVE 0 NEED {t('wedding.honeymoon.items.airfare.need')}
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => handleOpenGiftModal('airfare', {
                      title: t('wedding.honeymoon.items.airfare.title'),
                      shareUsd: 100,
                      shareCad: 135
                    })}
                    sx={{ 
                      bgcolor: colors.forestGreen, 
                      color: '#ffffff', 
                      borderRadius: '20px', 
                      px: 3,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      '&:hover': { bgcolor: colors.forestDark } 
                    }}
                  >
                    {t('wedding.honeymoon.addToCart')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* Item 2: HIGH SPEED TRAIN PASSES (Inverted on desktop) */}
          <Card 
            sx={{ 
              bgcolor: 'transparent', 
              boxShadow: 'none', 
              borderRadius: 0, 
              borderBottom: `1px solid rgba(184, 93, 56, 0.3)`, 
              pb: 6, 
              mb: 6 
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} sm={6} order={{ xs: 2, sm: 1 }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontFamily: "'Playfair Display', serif", 
                    color: colors.terracotta, 
                    fontSize: { xs: '2rem', md: '2.5rem' }, 
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    mb: 2 
                  }}
                >
                  {t('wedding.honeymoon.items.train.title')}
                </Typography>
                <Typography 
                  sx={{ 
                    color: colors.charcoal, 
                    fontSize: '0.85rem', 
                    letterSpacing: 1.5, 
                    lineHeight: 1.7, 
                    textTransform: 'uppercase', 
                    mb: 3, 
                    fontWeight: 500 
                  }}
                >
                  {t('wedding.honeymoon.items.train.description')}
                </Typography>
                <Typography 
                  sx={{ 
                    color: colors.terracotta, 
                    fontWeight: 700, 
                    letterSpacing: 1.5, 
                    fontSize: '0.95rem', 
                    mb: 2 
                  }}
                >
                  {t('wedding.honeymoon.items.train.shareText')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="caption" sx={{ letterSpacing: 1.5, fontWeight: 600, color: '#666' }}>
                    HAVE 0 NEED {t('wedding.honeymoon.items.train.need')}
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => handleOpenGiftModal('train', {
                      title: t('wedding.honeymoon.items.train.title'),
                      shareUsd: 100,
                      shareCad: 135
                    })}
                    sx={{ 
                      bgcolor: colors.forestGreen, 
                      color: '#ffffff', 
                      borderRadius: '20px', 
                      px: 3,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      '&:hover': { bgcolor: colors.forestDark } 
                    }}
                  >
                    {t('wedding.honeymoon.addToCart')}
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} order={{ xs: 1, sm: 2 }}>
                <Box 
                  component="img" 
                  src="/train.jpg" 
                  alt="High Speed Train" 
                  sx={{ width: '100%', borderRadius: '6px', height: 260, objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} 
                />
              </Grid>
            </Grid>
          </Card>

          {/* Item 3: LAKE COMO BOAT TOUR */}
          <Card 
            sx={{ 
              bgcolor: 'transparent', 
              boxShadow: 'none', 
              borderRadius: 0, 
              borderBottom: `1px solid rgba(184, 93, 56, 0.3)`, 
              pb: 6, 
              mb: 6 
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontFamily: "'Playfair Display', serif", 
                    color: colors.terracotta, 
                    fontSize: { xs: '2rem', md: '2.5rem' }, 
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    mb: 2,
                    display: { xs: 'block', sm: 'none' }
                  }}
                >
                  {t('wedding.honeymoon.items.lakeComo.title')}
                </Typography>
                <Box 
                  component="img" 
                  src="/lake_como.jpg" 
                  alt="Lake Como Boat Tour" 
                  sx={{ width: '100%', borderRadius: '6px', height: 260, objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontFamily: "'Playfair Display', serif", 
                    color: colors.terracotta, 
                    fontSize: { xs: '2rem', md: '2.5rem' }, 
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    mb: 2,
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {t('wedding.honeymoon.items.lakeComo.title')}
                </Typography>
                <Typography 
                  sx={{ 
                    color: colors.charcoal, 
                    fontSize: '0.85rem', 
                    letterSpacing: 1.5, 
                    lineHeight: 1.7, 
                    textTransform: 'uppercase', 
                    mb: 3, 
                    fontWeight: 500 
                  }}
                >
                  {t('wedding.honeymoon.items.lakeComo.description')}
                </Typography>
                <Typography 
                  sx={{ 
                    color: colors.terracotta, 
                    fontWeight: 700, 
                    letterSpacing: 1.5, 
                    fontSize: '0.95rem', 
                    mb: 2 
                  }}
                >
                  {t('wedding.honeymoon.items.lakeComo.shareText')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="caption" sx={{ letterSpacing: 1.5, fontWeight: 600, color: '#666' }}>
                    HAVE 0 NEED {t('wedding.honeymoon.items.lakeComo.need')}
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => handleOpenGiftModal('lakeComo', {
                      title: t('wedding.honeymoon.items.lakeComo.title'),
                      shareUsd: 150,
                      shareCad: 200
                    })}
                    sx={{ 
                      bgcolor: colors.forestGreen, 
                      color: '#ffffff', 
                      borderRadius: '20px', 
                      px: 3,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      '&:hover': { bgcolor: colors.forestDark } 
                    }}
                  >
                    {t('wedding.honeymoon.addToCart')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* Item 4: APORTE LIBRE (Custom Contribution) */}
          <Box 
            sx={{ 
              border: `2px dashed ${colors.terracotta}`, 
              borderRadius: 3, 
              p: { xs: 3, md: 5 }, 
              textAlign: 'center',
              bgcolor: 'rgba(255,255,255,0.6)'
            }}
          >
            <Typography 
              variant="h4" 
              sx={{ 
                fontFamily: "'Playfair Display', serif", 
                color: colors.terracotta, 
                letterSpacing: 2, 
                mb: 2 
              }}
            >
              {t('wedding.honeymoon.customContribution.title')}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: colors.charcoal, 
                maxWidth: 550, 
                mx: 'auto', 
                mb: 3, 
                lineHeight: 1.6 
              }}
            >
              {t('wedding.honeymoon.customContribution.description')}
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleOpenCustomModal}
              sx={{ 
                bgcolor: colors.terracotta, 
                color: '#fff', 
                borderRadius: '30px', 
                px: 4, 
                py: 1.2,
                fontWeight: 600,
                '&:hover': { bgcolor: colors.terracottaDark } 
              }}
            >
              {t('wedding.honeymoon.customContribution.button')}
            </Button>
          </Box>

          <Typography 
            variant="caption" 
            display="block" 
            sx={{ textAlign: 'center', mt: 4, color: '#777', fontStyle: 'italic' }}
          >
            {t('wedding.honeymoon.currencyNote')}
          </Typography>

        </Container>
      </Box>

      {/* SECCIÓN 2: TRAVEL AND LOGISTICS (Canva Verde) */}
      <Box id="logistics" sx={{ bgcolor: colors.forestGreen, color: colors.creamText, py: 10, px: 3 }}>
        <Container maxWidth="md">
          <Typography 
            variant="h2" 
            sx={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: { xs: '2.4rem', md: '3.6rem' }, 
              color: colors.sandBeige, 
              letterSpacing: 2,
              textAlign: 'center',
              textTransform: 'uppercase',
              mb: 6 
            }}
          >
            {t('wedding.logistics.title')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {/* Q1 */}
            <Box sx={{ borderLeft: `3px solid ${colors.goldAccent}`, pl: 3 }}>
              <Typography 
                sx={{ 
                  fontFamily: "'Montserrat', sans-serif", 
                  fontWeight: 600, 
                  letterSpacing: 1.5, 
                  color: colors.goldAccent, 
                  fontSize: '0.95rem',
                  mb: 1
                }}
              >
                {t('wedding.logistics.q1')}
              </Typography>
              <Typography sx={{ color: colors.creamText, fontSize: '0.9rem', lineHeight: 1.7, opacity: 0.9 }}>
                {t('wedding.logistics.a1')}
              </Typography>
            </Box>

            {/* Q2 */}
            <Box sx={{ borderLeft: `3px solid ${colors.goldAccent}`, pl: 3 }}>
              <Typography 
                sx={{ 
                  fontFamily: "'Montserrat', sans-serif", 
                  fontWeight: 600, 
                  letterSpacing: 1.5, 
                  color: colors.goldAccent, 
                  fontSize: '0.95rem',
                  mb: 1
                }}
              >
                {t('wedding.logistics.q2')}
              </Typography>
              <Typography sx={{ color: colors.creamText, fontSize: '0.9rem', lineHeight: 1.7, opacity: 0.9 }}>
                {t('wedding.logistics.a2')}
              </Typography>
            </Box>

            {/* Q3 */}
            <Box sx={{ borderLeft: `3px solid ${colors.goldAccent}`, pl: 3 }}>
              <Typography 
                sx={{ 
                  fontFamily: "'Montserrat', sans-serif", 
                  fontWeight: 600, 
                  letterSpacing: 1.5, 
                  color: colors.goldAccent, 
                  fontSize: '0.95rem',
                  mb: 1
                }}
              >
                {t('wedding.logistics.q3')}
              </Typography>
              <Typography sx={{ color: colors.creamText, fontSize: '0.9rem', lineHeight: 1.7, opacity: 0.9 }}>
                {t('wedding.logistics.a3')}
              </Typography>
            </Box>

            {/* Q4 */}
            <Box sx={{ borderLeft: `3px solid ${colors.goldAccent}`, pl: 3 }}>
              <Typography 
                sx={{ 
                  fontFamily: "'Montserrat', sans-serif", 
                  fontWeight: 600, 
                  letterSpacing: 1.5, 
                  color: colors.goldAccent, 
                  fontSize: '0.95rem',
                  mb: 1
                }}
              >
                {t('wedding.logistics.q4')}
              </Typography>
              <Typography sx={{ color: colors.creamText, fontSize: '0.9rem', lineHeight: 1.7, opacity: 0.9 }}>
                {t('wedding.logistics.a4')}
              </Typography>
            </Box>

            {/* Q5 */}
            <Box sx={{ borderLeft: `3px solid ${colors.goldAccent}`, pl: 3 }}>
              <Typography 
                sx={{ 
                  fontFamily: "'Montserrat', sans-serif", 
                  fontWeight: 600, 
                  letterSpacing: 1.5, 
                  color: colors.goldAccent, 
                  fontSize: '0.95rem',
                  mb: 1
                }}
              >
                {t('wedding.logistics.q5')}
              </Typography>
              <Typography sx={{ color: colors.creamText, fontSize: '0.9rem', lineHeight: 1.7, opacity: 0.9 }}>
                {t('wedding.logistics.a5')}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* SECCIÓN 3: ACCOMMODATIONS (Canva Beige) */}
      <Box id="accommodations" sx={{ bgcolor: colors.sandBeige, py: 8, px: 3 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography 
            variant="h2" 
            sx={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: { xs: '2.4rem', md: '3.4rem' }, 
              color: colors.terracotta, 
              letterSpacing: 2,
              textTransform: 'uppercase',
              mb: 2 
            }}
          >
            {t('wedding.accommodations.title')}
          </Typography>
          <Typography 
            sx={{ 
              color: colors.forestGreen, 
              fontWeight: 600, 
              letterSpacing: 1.5, 
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              mb: 3
            }}
          >
            {t('wedding.accommodations.q')}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: colors.charcoal, 
              fontSize: '0.95rem', 
              lineHeight: 1.8, 
              maxWidth: 650, 
              mx: 'auto' 
            }}
          >
            {t('wedding.accommodations.a')}
          </Typography>
        </Container>
      </Box>

      {/* SECCIÓN 4: DETAILS FOR AUGUST 7 (Canva Verde) */}
      <Box id="details" sx={{ bgcolor: colors.forestGreen, color: colors.creamText, py: 10, px: 3 }}>
        <Container maxWidth="md">
          <Typography 
            variant="h2" 
            sx={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: { xs: '2.4rem', md: '3.6rem' }, 
              color: colors.sandBeige, 
              letterSpacing: 2,
              textAlign: 'center',
              textTransform: 'uppercase',
              mb: 6 
            }}
          >
            {t('wedding.details.title')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {/* D1 */}
            <Box sx={{ borderLeft: `3px solid ${colors.goldAccent}`, pl: 3 }}>
              <Typography 
                sx={{ 
                  fontFamily: "'Montserrat', sans-serif", 
                  fontWeight: 600, 
                  letterSpacing: 1.5, 
                  color: colors.goldAccent, 
                  fontSize: '0.95rem',
                  mb: 1
                }}
              >
                {t('wedding.details.q1')}
              </Typography>
              <Typography sx={{ color: colors.creamText, fontSize: '0.9rem', lineHeight: 1.7, opacity: 0.9 }}>
                {t('wedding.details.a1')}
              </Typography>
            </Box>

            {/* D2 */}
            <Box sx={{ borderLeft: `3px solid ${colors.goldAccent}`, pl: 3 }}>
              <Typography 
                sx={{ 
                  fontFamily: "'Montserrat', sans-serif", 
                  fontWeight: 600, 
                  letterSpacing: 1.5, 
                  color: colors.goldAccent, 
                  fontSize: '0.95rem',
                  mb: 1
                }}
              >
                {t('wedding.details.q2')}
              </Typography>
              <Typography sx={{ color: colors.creamText, fontSize: '0.9rem', lineHeight: 1.7, opacity: 0.9 }}>
                {t('wedding.details.a2')}
              </Typography>
            </Box>

            {/* D3 */}
            <Box sx={{ borderLeft: `3px solid ${colors.goldAccent}`, pl: 3 }}>
              <Typography 
                sx={{ 
                  fontFamily: "'Montserrat', sans-serif", 
                  fontWeight: 600, 
                  letterSpacing: 1.5, 
                  color: colors.goldAccent, 
                  fontSize: '0.95rem',
                  mb: 1
                }}
              >
                {t('wedding.details.q3')}
              </Typography>
              <Typography sx={{ color: colors.creamText, fontSize: '0.9rem', lineHeight: 1.7, opacity: 0.9 }}>
                {t('wedding.details.a3')}
              </Typography>
            </Box>
          </Box>

          {/* Aviso de RSVP para la Boda */}
          <Box 
            sx={{ 
              mt: 8, 
              border: `1px solid ${colors.goldAccent}`, 
              borderRadius: 2, 
              p: 4, 
              textAlign: 'center',
              bgcolor: 'rgba(29, 47, 36, 0.6)'
            }}
          >
            <Typography variant="h4" sx={{ fontFamily: "'Playfair Display', serif", color: colors.goldAccent, mb: 1 }}>
              {t('wedding.rsvpNotice.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.creamText, opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
              {t('wedding.rsvpNotice.text')}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box sx={{ bgcolor: colors.forestDark, color: 'rgba(255,255,255,0.7)', py: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ letterSpacing: 2, fontSize: '0.8rem' }}>
          CAMILA & CONNOR • AUGUST 7, 2027 • EL SALVADOR
        </Typography>
      </Box>

      {/* MODAL DE CHECKOUT STRIPE */}
      <Dialog 
        open={checkoutModal.open} 
        onClose={() => !loadingPayment && setCheckoutModal({ ...checkoutModal, open: false })}
        PaperProps={{ 
          sx: { 
            borderRadius: 3, 
            p: 1, 
            maxWidth: 480, 
            width: '100%',
            bgcolor: '#ffffff',
            border: `2px solid ${colors.goldAccent}` 
          } 
        }}
      >
        <DialogTitle sx={{ pb: 1, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontFamily: "'Playfair Display', serif", color: colors.forestGreen }}>
            {t('wedding.honeymoon.modal.title')}
          </Typography>
          <Typography variant="caption" sx={{ color: colors.terracotta, fontWeight: 600, textTransform: 'uppercase' }}>
            {checkoutModal.title}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.85rem' }}>
              {errorMessage}
            </Alert>
          )}

          <TextField 
            fullWidth 
            label={t('wedding.honeymoon.modal.nameLabel')} 
            variant="outlined" 
            margin="normal"
            size="small"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ex: John & Sarah Smith"
          />

          <TextField 
            fullWidth 
            label={t('wedding.honeymoon.modal.emailLabel')} 
            variant="outlined" 
            margin="normal"
            size="small"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john.smith@example.com"
          />

          {/* Selector de Moneda */}
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            <FormLabel component="legend" sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.forestGreen }}>
              {i18n.language.startsWith('en') ? 'Preferred Currency' : i18n.language.startsWith('fr') ? 'Devise' : 'Moneda'}
            </FormLabel>
            <RadioGroup 
              row 
              value={formData.moneda} 
              onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
            >
              <FormControlLabel value="usd" control={<Radio size="small" />} label="USD ($)" />
              <FormControlLabel value="cad" control={<Radio size="small" />} label="CAD ($)" />
            </RadioGroup>
          </FormControl>

          {/* Cantidad de Cuotas o Monto Libre */}
          {!checkoutModal.isCustom ? (
            <Box sx={{ mt: 2 }}>
              <TextField 
                fullWidth 
                label={t('wedding.honeymoon.modal.quantityLabel')} 
                type="number"
                variant="outlined"
                size="small"
                inputProps={{ min: 1, max: 20 }}
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
              />
              <Typography variant="body2" sx={{ mt: 1, color: '#666', textAlign: 'right', fontWeight: 600 }}>
                {t('wedding.honeymoon.modal.totalLabel')}: {' '}
                <span style={{ color: colors.terracotta, fontSize: '1.2rem' }}>
                  ${(formData.moneda === 'cad' ? checkoutModal.unitCad : checkoutModal.unitUsd) * formData.cantidad}{' '}
                  {formData.moneda.toUpperCase()}
                </span>
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <TextField 
                fullWidth 
                label="Monto / Amount" 
                type="number"
                variant="outlined"
                size="small"
                inputProps={{ min: 5 }}
                value={formData.montoLibre}
                onChange={(e) => setFormData({ ...formData, montoLibre: e.target.value })}
              />
              <Typography variant="body2" sx={{ mt: 1, color: '#666', textAlign: 'right', fontWeight: 600 }}>
                {t('wedding.honeymoon.modal.totalLabel')}: {' '}
                <span style={{ color: colors.terracotta, fontSize: '1.2rem' }}>
                  ${formData.montoLibre || 0} {formData.moneda.toUpperCase()}
                </span>
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setCheckoutModal({ ...checkoutModal, open: false })} 
            disabled={loadingPayment}
            sx={{ color: '#888' }}
          >
            {t('wedding.honeymoon.modal.cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleProcessPayment} 
            disabled={loadingPayment}
            sx={{ 
              bgcolor: colors.forestGreen, 
              color: '#ffffff', 
              borderRadius: '25px', 
              px: 3, 
              fontWeight: 'bold',
              '&:hover': { bgcolor: colors.forestDark } 
            }}
          >
            {loadingPayment ? <CircularProgress size={22} color="inherit" /> : t('wedding.honeymoon.modal.proceedStripe')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notificaciones */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={6000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default Wedding;
