import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Card, TextField, Button, Grid, Chip, 
  Divider, Dialog, DialogTitle, DialogContent, DialogActions, 
  CircularProgress, Alert, Snackbar, RadioGroup, FormControlLabel, Radio, 
  FormControl, FormLabel, Accordion, AccordionSummary, AccordionDetails,
  Paper, IconButton, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import HotelIcon from '@mui/icons-material/Hotel';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LanguageIcon from '@mui/icons-material/Language';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import TrainIcon from '@mui/icons-material/Train';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';

import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '../components/StripeElementsCheckout';
import WeddingRsvpSection from '../components/WeddingRsvpSection';

const Wedding = () => {
  const { t, i18n } = useTranslation();

  // Guía interactiva por pestañas (0: Detalles, 1: Logística, 2: Hospedaje)
  const [activeGuideTab, setActiveGuideTab] = useState(0);

  // Contador regresivo en tiempo real (Agosto 7, 2027)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2027-08-07T16:00:00-06:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  // Inicializar Stripe
  useEffect(() => {
    const initStripe = async () => {
      let key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      const backendBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080'
        : 'https://api-boda-126620588755.us-central1.run.app';

      if (!key) {
        try {
          const res = await fetch(`${backendBase}/config-stripe`);
          const data = await res.json();
          if (data.publishableKey) {
            key = data.publishableKey;
          }
        } catch (e) {
          console.warn('No se pudo cargar la clave pública de Stripe', e);
        }
      }

      if (key) {
        setStripePromise(loadStripe(key));
      }
    };

    initStripe();
  }, []);

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
    setClientSecret('');
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
    setClientSecret('');
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

    setLoadingPayment(true);
    setErrorMessage('');

    const backendBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8080'
      : 'https://api-boda-126620588755.us-central1.run.app';

    const finalAmount = checkoutModal.isCustom 
      ? parseInt(formData.montoLibre) || 50
      : (formData.moneda === 'cad' ? checkoutModal.unitCad : checkoutModal.unitUsd) * formData.cantidad;

    // Intento con Stripe Elements (PaymentIntent)
    try {
      const piRes = await fetch(`${backendBase}/crear-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_regalo: checkoutModal.title,
          monto: finalAmount,
          moneda: formData.moneda,
          nombre_invitado: formData.nombre.trim(),
          email_invitado: formData.email.trim(),
        }),
      });

      if (piRes.ok) {
        const piData = await piRes.json();
        if (piData.clientSecret) {
          setClientSecret(piData.clientSecret);
          setLoadingPayment(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Fallo crear PaymentIntent, probando Stripe Checkout estándar...", e);
    }

    // Fallback: Redirección Stripe Checkout tradicional
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
      console.error("Error Stripe Checkout:", err);
      setErrorMessage('Error al conectar con el servidor de pagos.');
      setLoadingPayment(false);
    }
  };

  const scrollToSection = (id, guideTabIndex = null) => {
    if (guideTabIndex !== null) {
      setActiveGuideTab(guideTabIndex);
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Paleta de colores armonizada
  const colors = {
    forestGreen: '#1e382b',
    forestDark: '#14261d',
    forestMedium: '#274b39',
    sandBeige: '#f6ebd7',
    sandLight: '#faf6ef',
    copper: '#c7784f',
    copperLight: '#d98d68',
    copperDark: '#a15632',
    goldAccent: '#dfaf74',
    charcoal: '#222222',
    creamText: '#f6ebd7',
    terracotta: '#c7784f',
    terracottaDark: '#a15632',
  };

  // Lista de experiencias de Luna de Miel para renderizado en cuadrícula
  const honeymoonCards = [
    {
      key: 'airfare',
      icon: <FlightTakeoffIcon sx={{ color: colors.copper }} />,
      number: '01',
      title: t('wedding.honeymoon.items.airfare.title'),
      description: t('wedding.honeymoon.items.airfare.description'),
      image: '/airfare.jpg',
      shareText: t('wedding.honeymoon.items.airfare.shareText'),
      need: t('wedding.honeymoon.items.airfare.need'),
      shareUsd: 100,
      shareCad: 135,
    },
    {
      key: 'train',
      icon: <TrainIcon sx={{ color: colors.copper }} />,
      number: '02',
      title: t('wedding.honeymoon.items.train.title'),
      description: t('wedding.honeymoon.items.train.description'),
      image: '/train.jpg',
      shareText: t('wedding.honeymoon.items.train.shareText'),
      need: t('wedding.honeymoon.items.train.need'),
      shareUsd: 100,
      shareCad: 135,
    },
    {
      key: 'lakeComo',
      icon: <DirectionsBoatIcon sx={{ color: colors.copper }} />,
      number: '03',
      title: t('wedding.honeymoon.items.lakeComo.title'),
      description: t('wedding.honeymoon.items.lakeComo.description'),
      image: '/lake-como.jpg',
      shareText: t('wedding.honeymoon.items.lakeComo.shareText'),
      need: t('wedding.honeymoon.items.lakeComo.need'),
      shareUsd: 150,
      shareCad: 200,
    },
  ];

  return (
    <Box sx={{ bgcolor: colors.sandLight, minHeight: '100vh', color: colors.charcoal, overflowX: 'hidden', pb: { xs: 9, md: 4 } }}>
      
      {/* Botón flotante de idioma superior */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 110 }}>
        <Button 
          variant="contained" 
          onClick={toggleLanguage} 
          startIcon={<LanguageIcon sx={{ fontSize: 18 }} />}
          size="small"
          sx={{ 
            borderRadius: '20px', 
            bgcolor: 'rgba(30, 56, 43, 0.85)', 
            backdropFilter: 'blur(8px)',
            color: '#fff', 
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            border: `1px solid ${colors.copper}`,
            px: 2,
            py: 0.6,
            '&:hover': { bgcolor: colors.forestGreen } 
          }}
        >
          {i18n.language.startsWith('es') ? 'EN' : i18n.language.startsWith('en') ? 'FR' : 'ES'}
        </Button>
      </Box>

      {/* Banner discreto de acceso a Fiesta de Compromiso */}
      <Box sx={{ bgcolor: colors.forestDark, py: 1, textAlign: 'center', borderBottom: `1px solid rgba(199, 120, 79, 0.2)` }}>
        <Typography variant="caption" sx={{ color: colors.goldAccent, letterSpacing: 1.5, textTransform: 'uppercase', fontSize: '0.72rem' }}>
          {t('wedding.nav.engagementLink')}:{' '}
          <RouterLink to="/engagement" style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 600 }}>
            {i18n.language.startsWith('en') ? 'View Engagement Party' : i18n.language.startsWith('fr') ? 'Voir les Fiançailles' : 'Ver Fiesta de Compromiso'}
          </RouterLink>
        </Typography>
      </Box>

      {/* HERO SECTION DE LA BODA CON MOVIMIENTO Y CUENTA REGRESIVA EN VIVO */}
      <Box 
        sx={{ 
          minHeight: { xs: '85vh', md: '88vh' }, 
          backgroundImage: `linear-gradient(rgba(20, 38, 29, 0.72), rgba(20, 38, 29, 0.88)), url('/foret_venue.jpg')`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          color: 'white', 
          px: { xs: 2.5, sm: 3 }, 
          py: { xs: 6, md: 8 },
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Monograma con suave animación flotante */}
        <Box 
          component="img" 
          src="/cs-monogram.jpg" 
          alt="Camila & Connor Monogram" 
          sx={{ 
            width: { xs: 110, sm: 145 }, 
            height: { xs: 110, sm: 145 }, 
            borderRadius: '50%', 
            objectFit: 'cover',
            mb: 2.5,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6), 0 0 24px rgba(199, 120, 79, 0.35)',
            border: `2.5px solid ${colors.copper}`,
            transition: 'transform 0.4s ease, box-shadow 0.4s ease',
            animation: 'gentleFloat 4s ease-in-out infinite',
            '@keyframes gentleFloat': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-6px)' }
            },
            '&:hover': {
              transform: 'scale(1.06)',
            }
          }} 
        />
        
        <Typography 
          sx={{ 
            letterSpacing: 4, 
            fontSize: { xs: '0.78rem', sm: '1rem' }, 
            color: colors.goldAccent, 
            fontWeight: 600,
            textTransform: 'uppercase',
            mb: 0.5
          }}
        >
          {t('wedding.hero.subtitle')}
        </Typography>

        <Typography 
          variant="h1" 
          sx={{ 
            fontFamily: "'Playfair Display', serif", 
            fontSize: 'clamp(2.8rem, 8vw, 5.8rem)', 
            fontWeight: 400,
            lineHeight: 1.1, 
            color: '#ffffff',
            mb: 1.5
          }}
        >
          {t('wedding.hero.title')}
        </Typography>

        <Typography 
          variant="h4" 
          sx={{ 
            fontFamily: "'Playfair Display', serif", 
            color: colors.sandBeige, 
            fontSize: { xs: '1.1rem', sm: '1.5rem' },
            fontStyle: 'italic',
            mb: 0.5
          }}
        >
          {t('wedding.hero.date')}
        </Typography>

        <Typography 
          sx={{ 
            color: 'rgba(255,255,255,0.85)', 
            letterSpacing: 2, 
            fontSize: { xs: '0.8rem', sm: '0.95rem' } 
          }}
        >
          {t('wedding.hero.venue')}
        </Typography>

        {/* RELOJ CUENTA REGRESIVA INTERACTIVO EN VIVO */}
        <Box 
          sx={{ 
            mt: 3.5, 
            mb: 1,
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            justifyContent: 'center' 
          }}
        >
          {[
            { label: i18n.language.startsWith('en') ? 'Days' : i18n.language.startsWith('fr') ? 'Jours' : 'Días', value: timeLeft.days },
            { label: i18n.language.startsWith('en') ? 'Hours' : i18n.language.startsWith('fr') ? 'Heures' : 'Horas', value: timeLeft.hours },
            { label: i18n.language.startsWith('en') ? 'Min' : i18n.language.startsWith('fr') ? 'Min' : 'Min', value: timeLeft.minutes },
            { label: i18n.language.startsWith('en') ? 'Sec' : i18n.language.startsWith('fr') ? 'Sec' : 'Seg', value: timeLeft.seconds },
          ].map((item, idx) => (
            <Box 
              key={idx}
              sx={{
                bgcolor: 'rgba(20, 38, 29, 0.65)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${colors.copper}`,
                borderRadius: 2.5,
                p: { xs: '8px 12px', sm: '12px 18px' },
                minWidth: { xs: 58, sm: 78 },
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <Typography 
                sx={{ 
                  fontFamily: "'Playfair Display', serif", 
                  fontSize: { xs: '1.4rem', sm: '2rem' }, 
                  fontWeight: 700, 
                  color: colors.goldAccent,
                  lineHeight: 1 
                }}
              >
                {String(item.value).padStart(2, '0')}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: colors.sandBeige, 
                  textTransform: 'uppercase', 
                  fontSize: { xs: '0.62rem', sm: '0.72rem' },
                  letterSpacing: 1,
                  display: 'block',
                  mt: 0.5
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Botones de Navegación Rápida */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, justifyContent: 'center', mt: 3.5 }}>
          <Button 
            variant="contained" 
            onClick={() => scrollToSection('rsvp')}
            sx={{ 
              bgcolor: colors.copper, 
              color: '#ffffff', 
              borderRadius: '30px', 
              px: { xs: 2.5, sm: 3.5 },
              py: 0.9,
              fontWeight: 700,
              fontSize: { xs: '0.82rem', sm: '0.9rem' },
              boxShadow: '0 6px 20px rgba(199, 120, 79, 0.35)',
              '&:hover': { bgcolor: colors.copperDark } 
            }}
          >
            💍 {t('wedding.nav.rsvp')}
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => scrollToSection('guide', 0)}
            sx={{ 
              color: colors.sandBeige, 
              borderColor: colors.copper, 
              borderRadius: '30px', 
              px: { xs: 2, sm: 3 },
              py: 0.8,
              fontSize: { xs: '0.82rem', sm: '0.9rem' },
              '&:hover': { borderColor: colors.copperLight, bgcolor: 'rgba(199, 120, 79, 0.15)' } 
            }}
          >
            📍 {t('wedding.nav.details')}
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => scrollToSection('honeymoon')}
            sx={{ 
              color: colors.sandBeige, 
              borderColor: colors.copper, 
              borderRadius: '30px', 
              px: { xs: 2, sm: 3 },
              py: 0.8,
              fontSize: { xs: '0.82rem', sm: '0.9rem' },
              '&:hover': { borderColor: colors.copperLight, bgcolor: 'rgba(199, 120, 79, 0.15)' } 
            }}
          >
            ✈️ {t('wedding.nav.honeymoon')}
          </Button>
        </Box>
      </Box>

      {/* SECCIÓN 1: RSVP / CONFIRMACIÓN DE ASISTENCIA (Directo y destacado) */}
      <WeddingRsvpSection colors={colors} />

      {/* SECCIÓN 2: GUÍA COMPACTA E INTERACTIVA (EVENTO + LOGÍSTICA + ALOJAMIENTO) */}
      {/* Esta sección unificada por pestañas reduce el scroll vertical en un 70% */}
      <Box id="guide" sx={{ bgcolor: colors.forestGreen, color: colors.creamText, py: { xs: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
        <Container maxWidth="md">
          
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="overline" 
              sx={{ 
                letterSpacing: 3, 
                color: colors.goldAccent, 
                fontWeight: 700, 
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                display: 'block',
                mb: 0.5 
              }}
            >
              GUÍA PARA NUESTROS INVITADOS
            </Typography>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: { xs: '2rem', sm: '2.6rem', md: '3.2rem' }, 
                color: colors.sandBeige, 
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                mb: 2.5 
              }}
            >
              Detalles & Guía de Viaje
            </Typography>

            {/* PESTAÑAS SEGMENTADAS INTERACTIVAS (TABS CON BOTONES) */}
            <Paper 
              elevation={0}
              sx={{ 
                display: 'inline-flex', 
                bgcolor: 'rgba(20, 38, 29, 0.7)', 
                p: 0.6, 
                borderRadius: '30px', 
                border: `1px solid ${colors.copper}`,
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 0.5,
                maxWidth: '100%'
              }}
            >
              <Button
                id="details"
                size="small"
                startIcon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
                onClick={() => setActiveGuideTab(0)}
                sx={{
                  borderRadius: '25px',
                  px: { xs: 1.8, sm: 2.5 },
                  py: 0.8,
                  fontSize: { xs: '0.78rem', sm: '0.88rem' },
                  fontWeight: 700,
                  bgcolor: activeGuideTab === 0 ? colors.copper : 'transparent',
                  color: activeGuideTab === 0 ? '#ffffff' : colors.sandBeige,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    bgcolor: activeGuideTab === 0 ? colors.copperDark : 'rgba(199, 120, 79, 0.15)',
                  }
                }}
              >
                {t('wedding.nav.details')}
              </Button>

              <Button
                id="logistics"
                size="small"
                startIcon={<DirectionsBusIcon sx={{ fontSize: 18 }} />}
                onClick={() => setActiveGuideTab(1)}
                sx={{
                  borderRadius: '25px',
                  px: { xs: 1.8, sm: 2.5 },
                  py: 0.8,
                  fontSize: { xs: '0.78rem', sm: '0.88rem' },
                  fontWeight: 700,
                  bgcolor: activeGuideTab === 1 ? colors.copper : 'transparent',
                  color: activeGuideTab === 1 ? '#ffffff' : colors.sandBeige,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    bgcolor: activeGuideTab === 1 ? colors.copperDark : 'rgba(199, 120, 79, 0.15)',
                  }
                }}
              >
                {t('wedding.nav.logistics')}
              </Button>

              <Button
                id="accommodations"
                size="small"
                startIcon={<HotelIcon sx={{ fontSize: 18 }} />}
                onClick={() => setActiveGuideTab(2)}
                sx={{
                  borderRadius: '25px',
                  px: { xs: 1.8, sm: 2.5 },
                  py: 0.8,
                  fontSize: { xs: '0.78rem', sm: '0.88rem' },
                  fontWeight: 700,
                  bgcolor: activeGuideTab === 2 ? colors.copper : 'transparent',
                  color: activeGuideTab === 2 ? '#ffffff' : colors.sandBeige,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    bgcolor: activeGuideTab === 2 ? colors.copperDark : 'rgba(199, 120, 79, 0.15)',
                  }
                }}
              >
                {t('wedding.nav.accommodations')}
              </Button>
            </Paper>
          </Box>

          {/* CONTENIDO INTERACTIVO SEGÚN PESTAÑA */}
          <Box sx={{ mt: 3 }}>
            
            {/* PESTAÑA 0: DETALLES DEL EVENTO */}
            {activeGuideTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                {[
                  { q: t('wedding.details.q1'), a: t('wedding.details.a1'), defaultOpen: true },
                  { q: t('wedding.details.q2'), a: t('wedding.details.a2'), defaultOpen: true },
                  { q: t('wedding.details.q3'), a: t('wedding.details.a3'), defaultOpen: true },
                ].map((item, i) => (
                  <Accordion 
                    key={i} 
                    defaultExpanded={item.defaultOpen}
                    sx={{
                      bgcolor: 'rgba(20, 38, 29, 0.65)',
                      backdropFilter: 'blur(8px)',
                      color: colors.creamText,
                      borderRadius: '12px !important',
                      border: `1px solid rgba(199, 120, 79, 0.3)`,
                      overflow: 'hidden',
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon sx={{ color: colors.goldAccent }} />}
                      sx={{ px: { xs: 2, sm: 3 } }}
                    >
                      <Typography 
                        sx={{ 
                          fontFamily: "'Montserrat', sans-serif", 
                          fontWeight: 700, 
                          color: colors.goldAccent, 
                          fontSize: { xs: '0.88rem', sm: '0.98rem' },
                          letterSpacing: 1,
                        }}
                      >
                        {item.q}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pt: 0, pb: 2.5 }}>
                      <Typography sx={{ color: colors.creamText, fontSize: { xs: '0.85rem', sm: '0.92rem' }, lineHeight: 1.7, opacity: 0.9 }}>
                        {item.a}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}

            {/* PESTAÑA 1: VIAJE Y LOGÍSTICA */}
            {activeGuideTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                {[
                  { q: t('wedding.logistics.q1'), a: t('wedding.logistics.a1') },
                  { q: t('wedding.logistics.q2'), a: t('wedding.logistics.a2') },
                  { q: t('wedding.logistics.q3'), a: t('wedding.logistics.a3') },
                  { q: t('wedding.logistics.q4'), a: t('wedding.logistics.a4') },
                  { q: t('wedding.logistics.q5'), a: t('wedding.logistics.a5') },
                ].map((item, i) => (
                  <Accordion 
                    key={i} 
                    defaultExpanded={i === 0}
                    sx={{
                      bgcolor: 'rgba(20, 38, 29, 0.65)',
                      backdropFilter: 'blur(8px)',
                      color: colors.creamText,
                      borderRadius: '12px !important',
                      border: `1px solid rgba(199, 120, 79, 0.3)`,
                      overflow: 'hidden',
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon sx={{ color: colors.goldAccent }} />}
                      sx={{ px: { xs: 2, sm: 3 } }}
                    >
                      <Typography 
                        sx={{ 
                          fontFamily: "'Montserrat', sans-serif", 
                          fontWeight: 700, 
                          color: colors.goldAccent, 
                          fontSize: { xs: '0.88rem', sm: '0.98rem' },
                          letterSpacing: 1,
                        }}
                      >
                        {item.q}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pt: 0, pb: 2.5 }}>
                      <Typography sx={{ color: colors.creamText, fontSize: { xs: '0.85rem', sm: '0.92rem' }, lineHeight: 1.7, opacity: 0.9 }}>
                        {item.a}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}

            {/* PESTAÑA 2: HOSPEDAJE Y ALOJAMIENTO */}
            {activeGuideTab === 2 && (
              <Box 
                sx={{ 
                  bgcolor: 'rgba(20, 38, 29, 0.65)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid rgba(199, 120, 79, 0.35)`,
                  borderRadius: 3, 
                  p: { xs: 3, sm: 4 }, 
                  textAlign: 'center' 
                }}
              >
                <HotelIcon sx={{ fontSize: 44, color: colors.goldAccent, mb: 1.5 }} />
                <Typography 
                  sx={{ 
                    fontFamily: "'Montserrat', sans-serif", 
                    fontWeight: 700, 
                    color: colors.goldAccent, 
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    mb: 2 
                  }}
                >
                  {t('wedding.accommodations.q')}
                </Typography>
                <Typography 
                  sx={{ 
                    color: colors.creamText, 
                    fontSize: { xs: '0.88rem', sm: '0.95rem' }, 
                    lineHeight: 1.8, 
                    maxWidth: 620, 
                    mx: 'auto',
                    opacity: 0.95
                  }}
                >
                  {t('wedding.accommodations.a')}
                </Typography>
              </Box>
            )}

          </Box>
        </Container>
      </Box>

      {/* SECCIÓN 3: EL FONDO DE LUNA DE MIEL (REDiseñado en cuadrícula compacta y atractiva) */}
      <Box id="honeymoon" sx={{ bgcolor: colors.sandLight, pt: { xs: 6, md: 8 }, pb: 6, px: { xs: 2, sm: 3 } }}>
        <Container maxWidth="lg">
          
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
            {/* Monograma pequeño */}
            <Box 
              component="img" 
              src="/cs-monogram.jpg" 
              alt="CS Monogram" 
              sx={{ 
                width: { xs: 65, sm: 80 }, 
                height: { xs: 65, sm: 80 }, 
                borderRadius: '50%', 
                mx: 'auto', 
                mb: 1.5,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                border: `2px solid ${colors.copper}`,
              }} 
            />
            
            <Typography 
              variant="overline" 
              sx={{ 
                letterSpacing: 3, 
                fontWeight: 700, 
                color: colors.copper, 
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                display: 'block' 
              }}
            >
              REGISTRO DE REGALOS
            </Typography>

            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: { xs: '2.1rem', sm: '2.8rem', md: '3.4rem' }, 
                color: colors.forestGreen, 
                letterSpacing: 1.5,
                lineHeight: 1.15,
                mb: 0.5 
              }}
            >
              The Honeymoon
            </Typography>
            
            <Typography 
              variant="h4" 
              sx={{ 
                fontFamily: "'Monsieur La Doulaise', cursive", 
                fontSize: { xs: '2.6rem', sm: '3.4rem' }, 
                color: colors.copper, 
                mt: -1,
                mb: 1.5
              }}
            >
              Fund
            </Typography>

            <Typography 
              sx={{ 
                color: colors.charcoal, 
                fontSize: { xs: '0.88rem', sm: '0.98rem' }, 
                maxWidth: 680, 
                mx: 'auto', 
                lineHeight: 1.7, 
                opacity: 0.85 
              }}
            >
              {t('wedding.honeymoon.description')}
            </Typography>
          </Box>

          {/* CUADRÍCULA DE EXPERIENCIAS (RESPONSIVA 3 COLUMNAS) */}
          <Grid container spacing={3} justifyContent="center">
            {honeymoonCards.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.key}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: '#ffffff',
                    border: `1px solid ${colors.sandBeige}`,
                    boxShadow: '0 8px 24px rgba(30, 56, 43, 0.06)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 16px 36px rgba(30, 56, 43, 0.12)',
                      borderColor: colors.copper,
                    }
                  }}
                >
                  {/* Imagen de la experiencia con efecto zoom */}
                  <Box sx={{ position: 'relative', overflow: 'hidden', height: 190 }}>
                    <Box 
                      component="img" 
                      src={item.image} 
                      alt={item.title}
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                        '&:hover': { transform: 'scale(1.08)' }
                      }} 
                    />
                    <Chip 
                      label={`EXPÉRIENCE ${item.number}`}
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: 12, 
                        left: 12, 
                        bgcolor: 'rgba(20, 38, 29, 0.85)', 
                        backdropFilter: 'blur(4px)',
                        color: colors.goldAccent, 
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        letterSpacing: 1 
                      }} 
                    />
                  </Box>

                  <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1, textAlign: 'center' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontFamily: "'Playfair Display', serif", 
                        color: colors.forestGreen, 
                        fontWeight: 700,
                        fontSize: '1.15rem',
                        lineHeight: 1.3,
                        mb: 1,
                        minHeight: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666', 
                        fontSize: '0.82rem', 
                        lineHeight: 1.6, 
                        mb: 2,
                        flexGrow: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {item.description}
                    </Typography>

                    <Divider sx={{ my: 1.5, borderColor: '#f0e6d6' }} />

                    <Typography 
                      sx={{ 
                        fontFamily: "'Montserrat', sans-serif", 
                        fontWeight: 700, 
                        color: colors.copper, 
                        fontSize: '0.88rem', 
                        letterSpacing: 0.5,
                        mb: 0.5 
                      }}
                    >
                      {item.shareText}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 2 }}>
                      HAVE 0 NEED {item.need}
                    </Typography>

                    <Button 
                      variant="contained" 
                      onClick={() => handleOpenGiftModal(item.key, item)}
                      startIcon={<CardGiftcardIcon sx={{ fontSize: 18 }} />}
                      sx={{ 
                        bgcolor: colors.terracotta, 
                        color: '#ffffff', 
                        borderRadius: '25px', 
                        py: 0.9,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        letterSpacing: 0.8,
                        boxShadow: '0 4px 12px rgba(199, 120, 79, 0.25)',
                        '&:hover': { bgcolor: colors.terracottaDark } 
                      }}
                    >
                      {t('wedding.honeymoon.addToCart')}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* TARJETA DE APORTE LIBRE (COMPACTA Y ELEGANTE) */}
          <Box 
            sx={{ 
              mt: 4,
              bgcolor: colors.forestGreen, 
              color: colors.creamText, 
              borderRadius: 3.5, 
              p: { xs: 3, sm: 4 }, 
              textAlign: 'center',
              border: `1px solid ${colors.copper}`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)' 
            }}
          >
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
              <Grid item xs={12} md={8} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontFamily: "'Playfair Display', serif", 
                    color: colors.sandBeige, 
                    fontWeight: 700,
                    mb: 0.5 
                  }}
                >
                  ✨ {t('wedding.honeymoon.customContribution.title')}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(245, 235, 215, 0.9)', 
                    fontSize: '0.88rem',
                    lineHeight: 1.6 
                  }}
                >
                  {t('wedding.honeymoon.customContribution.description')}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                <Button 
                  variant="contained" 
                  onClick={handleOpenCustomModal}
                  size="large"
                  sx={{ 
                    bgcolor: colors.terracotta, 
                    color: '#fff', 
                    borderRadius: '25px', 
                    px: 3.5, 
                    py: 1.2,
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    boxShadow: '0 4px 16px rgba(199, 120, 79, 0.4)',
                    '&:hover': { bgcolor: colors.terracottaDark } 
                  }}
                >
                  {t('wedding.honeymoon.customContribution.button')}
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Typography 
            variant="caption" 
            display="block" 
            sx={{ textAlign: 'center', mt: 3, color: '#888', fontStyle: 'italic' }}
          >
            {t('wedding.honeymoon.currencyNote')}
          </Typography>

        </Container>
      </Box>

      {/* FOOTER */}
      <Box sx={{ bgcolor: colors.forestDark, color: 'rgba(255,255,255,0.7)', py: 3.5, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ letterSpacing: 2, fontSize: '0.78rem' }}>
          CAMILA & CONNOR • AUGUST 7, 2027 • EL SALVADOR
        </Typography>
      </Box>

      {/* BARRA DE NAVEGACIÓN RÁPIDA FLOTANTE INFERIOR (ESTILO APP NATIVA MÓVIL Y DESKTOP) */}
      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 99,
          bgcolor: 'rgba(20, 38, 29, 0.92)',
          backdropFilter: 'blur(12px)',
          border: `1.5px solid ${colors.copper}`,
          borderRadius: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.38), 0 0 16px rgba(199, 120, 79, 0.25)',
          px: { xs: 1.5, sm: 2.5 },
          py: 0.8,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          maxWidth: '92vw'
        }}
      >
        <Tooltip title="Confirmar Asistencia">
          <Button 
            onClick={() => scrollToSection('rsvp')}
            size="small"
            sx={{ 
              color: colors.sandBeige, 
              fontWeight: 700, 
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              borderRadius: '20px',
              px: { xs: 1, sm: 1.5 },
              '&:hover': { bgcolor: 'rgba(199, 120, 79, 0.2)' }
            }}
          >
            💍 RSVP
          </Button>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(199, 120, 79, 0.4)', height: 18, my: 'auto' }} />

        <Tooltip title="Ver Guía y Detalles">
          <Button 
            onClick={() => scrollToSection('guide', 0)}
            size="small"
            sx={{ 
              color: colors.sandBeige, 
              fontWeight: 700, 
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              borderRadius: '20px',
              px: { xs: 1, sm: 1.5 },
              '&:hover': { bgcolor: 'rgba(199, 120, 79, 0.2)' }
            }}
          >
            📍 Guía
          </Button>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(199, 120, 79, 0.4)', height: 18, my: 'auto' }} />

        <Tooltip title="Fondo de Luna de Miel">
          <Button 
            onClick={() => scrollToSection('honeymoon')}
            size="small"
            sx={{ 
              color: colors.sandBeige, 
              fontWeight: 700, 
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              borderRadius: '20px',
              px: { xs: 1, sm: 1.5 },
              '&:hover': { bgcolor: 'rgba(199, 120, 79, 0.2)' }
            }}
          >
            ✈️ Regalos
          </Button>
        </Tooltip>
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

          {clientSecret && stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'flat',
                  variables: {
                    colorPrimary: colors.terracotta,
                    colorBackground: '#faf6ef',
                    colorText: '#222222',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <StripePaymentForm
                totalAmount={
                  checkoutModal.isCustom
                    ? parseInt(formData.montoLibre) || 50
                    : (formData.moneda === 'cad' ? checkoutModal.unitCad : checkoutModal.unitUsd) * formData.cantidad
                }
                currency={formData.moneda}
                colors={colors}
                onCancel={() => setClientSecret('')}
                onSuccess={() => {
                  setCheckoutModal({ ...checkoutModal, open: false });
                  setClientSecret('');
                  setToast({
                    open: true,
                    message: i18n.language.startsWith('en') 
                      ? "Thank you so much for contributing to our Honeymoon! ❤️✈️" 
                      : i18n.language.startsWith('fr')
                      ? "Merci infiniment pour votre participation à notre lune de miel ! ❤️✈️"
                      : "¡Muchísimas gracias por tu contribución a nuestra luna de miel! ❤️✈️",
                    severity: 'success'
                  });
                }}
              />
            </Elements>
          ) : (
            <>
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
            </>
          )}
        </DialogContent>

        {!clientSecret && (
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
              {loadingPayment ? <CircularProgress size={22} color="inherit" /> : (t('wedding.honeymoon.modal.proceedStripe') || 'Pagar con Stripe')}
            </Button>
          </DialogActions>
        )}
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
