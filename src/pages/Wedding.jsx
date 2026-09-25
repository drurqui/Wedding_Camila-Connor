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
import BlockIcon from '@mui/icons-material/Block';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ChurchIcon from '@mui/icons-material/Church';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TerrainIcon from '@mui/icons-material/Terrain';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import SailingIcon from '@mui/icons-material/Sailing';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

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
        : 'https://api-boda-736009271165.us-central1.run.app';

      if (!key) {
        try {
          const res = await fetch(`${backendBase}/config-stripe`);
          if (res.ok) {
            const data = await res.json();
            if (data.publishableKey) {
              key = data.publishableKey;
            }
          }
        } catch {
          // Stripe opcional en caso de backend sin configurar
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
          ? "Thank you so much for contributing to our Honeymoon!" 
          : i18n.language.startsWith('fr')
          ? "Merci infiniment pour votre participation à notre lune de miel !"
          : "¡Muchísimas gracias por tu contribución a nuestra luna de miel!",
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
      : 'https://api-boda-736009271165.us-central1.run.app';

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

  // Lista de experiencias de Luna de Miel para renderizado en cuadrícula (16 experiencias completas)
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
      image: '/lake_como.jpg',
      shareText: t('wedding.honeymoon.items.lakeComo.shareText'),
      need: t('wedding.honeymoon.items.lakeComo.need'),
      shareUsd: 150,
      shareCad: 200,
    },
    {
      key: 'lakesideBreakfast',
      icon: <LocalCafeIcon sx={{ color: colors.copper }} />,
      number: '04',
      title: t('wedding.honeymoon.items.lakesideBreakfast.title'),
      description: t('wedding.honeymoon.items.lakesideBreakfast.description'),
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.lakesideBreakfast.shareText'),
      need: t('wedding.honeymoon.items.lakesideBreakfast.need'),
      shareUsd: 30,
      shareCad: 40,
    },
    {
      key: 'colosseum',
      icon: <AccountBalanceIcon sx={{ color: colors.copper }} />,
      number: '05',
      title: t('wedding.honeymoon.items.colosseum.title'),
      description: t('wedding.honeymoon.items.colosseum.description'),
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.colosseum.shareText'),
      need: t('wedding.honeymoon.items.colosseum.need'),
      shareUsd: 80,
      shareCad: 110,
    },
    {
      key: 'vatican',
      icon: <ChurchIcon sx={{ color: colors.copper }} />,
      number: '06',
      title: t('wedding.honeymoon.items.vatican.title'),
      description: t('wedding.honeymoon.items.vatican.description'),
      image: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.vatican.shareText'),
      need: t('wedding.honeymoon.items.vatican.need'),
      shareUsd: 90,
      shareCad: 120,
    },
    {
      key: 'trastevereDinner',
      icon: <RestaurantIcon sx={{ color: colors.copper }} />,
      number: '07',
      title: t('wedding.honeymoon.items.trastevereDinner.title'),
      description: t('wedding.honeymoon.items.trastevereDinner.description'),
      image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.trastevereDinner.shareText'),
      need: t('wedding.honeymoon.items.trastevereDinner.need'),
      shareUsd: 100,
      shareCad: 135,
    },
    {
      key: 'mountEtna',
      icon: <TerrainIcon sx={{ color: colors.copper }} />,
      number: '08',
      title: t('wedding.honeymoon.items.mountEtna.title'),
      description: t('wedding.honeymoon.items.mountEtna.description'),
      image: 'https://images.unsplash.com/photo-1533604195513-ab4ffb3b4f9a?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.mountEtna.shareText'),
      need: t('wedding.honeymoon.items.mountEtna.need'),
      shareUsd: 120,
      shareCad: 160,
    },
    {
      key: 'sicilianFood',
      icon: <FastfoodIcon sx={{ color: colors.copper }} />,
      number: '09',
      title: t('wedding.honeymoon.items.sicilianFood.title'),
      description: t('wedding.honeymoon.items.sicilianFood.description'),
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.sicilianFood.shareText'),
      need: t('wedding.honeymoon.items.sicilianFood.need'),
      shareUsd: 60,
      shareCad: 80,
    },
    {
      key: 'acropolis',
      icon: <AccountBalanceIcon sx={{ color: colors.copper }} />,
      number: '10',
      title: t('wedding.honeymoon.items.acropolis.title'),
      description: t('wedding.honeymoon.items.acropolis.description'),
      image: 'https://images.unsplash.com/photo-1555993539-1732916b8235?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.acropolis.shareText'),
      need: t('wedding.honeymoon.items.acropolis.need'),
      shareUsd: 40,
      shareCad: 55,
    },
    {
      key: 'catamaranCruise',
      icon: <SailingIcon sx={{ color: colors.copper }} />,
      number: '11',
      title: t('wedding.honeymoon.items.catamaranCruise.title'),
      description: t('wedding.honeymoon.items.catamaranCruise.description'),
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.catamaranCruise.shareText'),
      need: t('wedding.honeymoon.items.catamaranCruise.need'),
      shareUsd: 175,
      shareCad: 235,
    },
    {
      key: 'hotelLakeComo',
      icon: <HotelIcon sx={{ color: colors.copper }} />,
      number: '12',
      title: t('wedding.honeymoon.items.hotelLakeComo.title'),
      description: t('wedding.honeymoon.items.hotelLakeComo.description'),
      image: 'https://images.unsplash.com/photo-1580837119756-563d608dd119?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.hotelLakeComo.shareText'),
      need: t('wedding.honeymoon.items.hotelLakeComo.need'),
      shareUsd: 350,
      shareCad: 490,
    },
    {
      key: 'hotelTrastevere',
      icon: <HotelIcon sx={{ color: colors.copper }} />,
      number: '13',
      title: t('wedding.honeymoon.items.hotelTrastevere.title'),
      description: t('wedding.honeymoon.items.hotelTrastevere.description'),
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.hotelTrastevere.shareText'),
      need: t('wedding.honeymoon.items.hotelTrastevere.need'),
      shareUsd: 150,
      shareCad: 200,
    },
    {
      key: 'hotelSicily',
      icon: <HotelIcon sx={{ color: colors.copper }} />,
      number: '14',
      title: t('wedding.honeymoon.items.hotelSicily.title'),
      description: t('wedding.honeymoon.items.hotelSicily.description'),
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.hotelSicily.shareText'),
      need: t('wedding.honeymoon.items.hotelSicily.need'),
      shareUsd: 250,
      shareCad: 350,
    },
    {
      key: 'hotelAthens',
      icon: <HotelIcon sx={{ color: colors.copper }} />,
      number: '15',
      title: t('wedding.honeymoon.items.hotelAthens.title'),
      description: t('wedding.honeymoon.items.hotelAthens.description'),
      image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.hotelAthens.shareText'),
      need: t('wedding.honeymoon.items.hotelAthens.need'),
      shareUsd: 200,
      shareCad: 280,
    },
    {
      key: 'hotelSantorini',
      icon: <HotelIcon sx={{ color: colors.copper }} />,
      number: '16',
      title: t('wedding.honeymoon.items.hotelSantorini.title'),
      description: t('wedding.honeymoon.items.hotelSantorini.description'),
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      shareText: t('wedding.honeymoon.items.hotelSantorini.shareText'),
      need: t('wedding.honeymoon.items.hotelSantorini.need'),
      shareUsd: 400,
      shareCad: 560,
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
            { label: t('wedding.hero.countdown.days', 'Días'), value: timeLeft.days },
            { label: t('wedding.hero.countdown.hours', 'Horas'), value: timeLeft.hours },
            { label: t('wedding.hero.countdown.minutes', 'Min'), value: timeLeft.minutes },
            { label: t('wedding.hero.countdown.seconds', 'Seg'), value: timeLeft.seconds },
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
              letterSpacing: 1.2,
              boxShadow: '0 6px 20px rgba(199, 120, 79, 0.35)',
              '&:hover': { bgcolor: colors.copperDark } 
            }}
          >
            {t('wedding.nav.rsvp')}
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => scrollToSection('our-journey')}
            startIcon={<AutoStoriesIcon sx={{ fontSize: 18 }} />}
            sx={{ 
              color: colors.sandBeige, 
              borderColor: colors.copper, 
              borderRadius: '30px', 
              px: { xs: 2, sm: 2.5 },
              py: 0.8,
              fontWeight: 600,
              letterSpacing: 1.2,
              fontSize: { xs: '0.82rem', sm: '0.9rem' },
              '&:hover': { borderColor: colors.copperLight, bgcolor: 'rgba(199, 120, 79, 0.15)' } 
            }}
          >
            {t('wedding.ourJourney.subtitle', 'Together')}
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => scrollToSection('guide', 0)}
            sx={{ 
              color: colors.sandBeige, 
              borderColor: colors.copper, 
              borderRadius: '30px', 
              px: { xs: 2, sm: 2.5 },
              py: 0.8,
              fontWeight: 600,
              letterSpacing: 1.2,
              fontSize: { xs: '0.82rem', sm: '0.9rem' },
              '&:hover': { borderColor: colors.copperLight, bgcolor: 'rgba(199, 120, 79, 0.15)' } 
            }}
          >
            {t('wedding.nav.details')}
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => scrollToSection('honeymoon')}
            sx={{ 
              color: colors.sandBeige, 
              borderColor: colors.copper, 
              borderRadius: '30px', 
              px: { xs: 2, sm: 2.5 },
              py: 0.8,
              fontWeight: 600,
              letterSpacing: 1.2,
              fontSize: { xs: '0.82rem', sm: '0.9rem' },
              '&:hover': { borderColor: colors.copperLight, bgcolor: 'rgba(199, 120, 79, 0.15)' } 
            }}
          >
            {t('wedding.nav.honeymoon')}
          </Button>
        </Box>
      </Box>

      {/* SECCIÓN: NUESTRA HISTORIA (OUR JOURNEY TOGETHER) */}
      <Box 
        id="our-journey" 
        sx={{ 
          bgcolor: colors.forestDark, 
          color: colors.creamText, 
          py: { xs: 7, md: 9 }, 
          px: { xs: 2.5, sm: 4 },
          borderBottom: `1px solid rgba(199, 120, 79, 0.25)`,
          position: 'relative'
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="overline" 
              sx={{ 
                letterSpacing: 4, 
                color: colors.goldAccent, 
                fontWeight: 700, 
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                display: 'block',
                mb: 1
              }}
            >
              {t('wedding.ourJourney.overline', 'OUR STORY')}
            </Typography>

            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: { xs: '2.2rem', sm: '3rem', md: '3.6rem' }, 
                color: colors.sandBeige, 
                letterSpacing: 2,
                lineHeight: 1.1,
                mb: 0.5
              }}
            >
              {t('wedding.ourJourney.title', 'OUR JOURNEY')}
            </Typography>

            <Typography 
              variant="h4" 
              sx={{ 
                fontFamily: "'Monsieur La Doulaise', cursive", 
                fontSize: { xs: '2.6rem', sm: '3.6rem' }, 
                color: colors.copper, 
                mt: -1,
                mb: 3
              }}
            >
              {t('wedding.ourJourney.subtitle', 'Together')}
            </Typography>

            <Box 
              sx={{ 
                maxWidth: 780, 
                mx: 'auto', 
                p: { xs: 3, sm: 4.5 }, 
                borderRadius: '16px',
                bgcolor: 'rgba(30, 56, 43, 0.55)',
                border: `1px solid rgba(199, 120, 79, 0.35)`,
                boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(6px)'
              }}
            >
              <Typography 
                sx={{ 
                  color: colors.sandBeige, 
                  fontSize: { xs: '0.95rem', sm: '1.08rem' }, 
                  lineHeight: 1.9, 
                  letterSpacing: 0.3,
                  fontWeight: 300,
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}
              >
                "{t('wedding.ourJourney.text')}"
              </Typography>
            </Box>
          </Box>
        </Container>
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
              {t('wedding.guide.overline', 'GUÍA PARA NUESTROS INVITADOS')}
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
              {t('wedding.guide.title', 'Detalles & Guía de Viaje')}
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

              <Button
                id="faqs"
                size="small"
                startIcon={<HelpOutlineIcon sx={{ fontSize: 18 }} />}
                onClick={() => setActiveGuideTab(3)}
                sx={{
                  borderRadius: '25px',
                  px: { xs: 1.8, sm: 2.5 },
                  py: 0.8,
                  fontSize: { xs: '0.78rem', sm: '0.88rem' },
                  fontWeight: 700,
                  bgcolor: activeGuideTab === 3 ? colors.copper : 'transparent',
                  color: activeGuideTab === 3 ? '#ffffff' : colors.sandBeige,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    bgcolor: activeGuideTab === 3 ? colors.copperDark : 'rgba(199, 120, 79, 0.15)',
                  }
                }}
              >
                FAQs
              </Button>
            </Paper>
          </Box>

          {/* CONTENIDO INTERACTIVO SEGÚN PESTAÑA */}
          <Box sx={{ mt: 3 }}>
            
            {/* PESTAÑA 0: DETALLES DEL EVENTO & CRONOGRAMA */}
            {activeGuideTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* BLOQUE CRONOGRAMA ELEGANTE (SCHEDULE OF EVENTS) */}
                <Box 
                  sx={{
                    p: { xs: 2.5, sm: 3.5 },
                    borderRadius: '16px',
                    bgcolor: 'rgba(20, 38, 29, 0.75)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${colors.copper}`,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                  }}
                >
                  <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: colors.goldAccent,
                        letterSpacing: 3,
                        fontWeight: 700,
                        fontSize: '0.78rem',
                      }}
                    >
                      {t('wedding.schedule.date', 'AUGUST 7, 2027')}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: "'Playfair Display', serif",
                        color: colors.sandBeige,
                        letterSpacing: 1.5,
                        mt: 0.5,
                        fontSize: { xs: '1.4rem', sm: '1.8rem' }
                      }}
                    >
                      {t('wedding.schedule.title', 'SCHEDULE OF EVENTS')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {(() => {
                      const scheduleItems = t('wedding.schedule.items', { returnObjects: true });
                      const list = Array.isArray(scheduleItems) ? scheduleItems : [];
                      return list.map((item, idx) => (
                        <Box 
                          key={idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 1.5, sm: 2.5 },
                            p: { xs: 1.4, sm: 1.8 },
                            borderRadius: '0 12px 12px 0',
                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                            borderLeft: `4px solid ${colors.goldAccent}`,
                            transition: 'all 0.25s ease',
                            '&:hover': {
                              bgcolor: 'rgba(199, 120, 79, 0.12)',
                              transform: 'translateX(4px)',
                            }
                          }}
                        >
                          <Box 
                            sx={{ 
                              minWidth: { xs: 78, sm: 95 }, 
                              bgcolor: 'rgba(199, 120, 79, 0.2)', 
                              py: 0.6, 
                              px: 1, 
                              borderRadius: '8px', 
                              textAlign: 'center',
                              border: `1px solid rgba(199, 120, 79, 0.4)`
                            }}
                          >
                            <Typography 
                              sx={{ 
                                fontWeight: 800, 
                                color: colors.goldAccent, 
                                fontSize: { xs: '0.8rem', sm: '0.92rem' } 
                              }}
                            >
                              {item.time}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography 
                              sx={{ 
                                fontWeight: 700, 
                                color: colors.sandBeige, 
                                fontSize: { xs: '0.92rem', sm: '1.05rem' } 
                              }}
                            >
                              {item.title}
                            </Typography>
                            <Typography 
                              sx={{ 
                                color: 'rgba(255,255,255,0.75)', 
                                fontSize: { xs: '0.78rem', sm: '0.86rem' } 
                              }}
                            >
                              {item.description}
                            </Typography>
                          </Box>
                        </Box>
                      ));
                    })()}
                  </Box>
                </Box>

                {/* ACORDEONES DE DETALLES Y CÓDIGO DE VESTIMENTA */}
                {[
                  { q: t('wedding.details.q1'), a: t('wedding.details.a1'), defaultOpen: true },
                  { q: t('wedding.details.q2'), a: t('wedding.details.a2'), defaultOpen: true },
                  { 
                    q: t('wedding.details.q3'), 
                    a: t('wedding.details.a3'), 
                    isDressCode: true,
                    defaultOpen: true 
                  },
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

                      {item.isDressCode && (
                        <Box
                          sx={{
                            mt: 2.2,
                            p: { xs: 2, sm: 2.5 },
                            borderRadius: '12px',
                            bgcolor: 'rgba(199, 120, 79, 0.12)',
                            border: '1px solid rgba(199, 120, 79, 0.45)',
                            borderLeft: `4px solid ${colors.goldAccent}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <BlockIcon sx={{ color: '#e57373', fontSize: 20 }} />
                            <Typography
                              sx={{
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 700,
                                fontSize: { xs: '0.85rem', sm: '0.92rem' },
                                color: colors.goldAccent,
                                letterSpacing: 0.5,
                                textTransform: 'uppercase',
                              }}
                            >
                              {t('wedding.details.dressCodeNoteTitle')}
                            </Typography>
                          </Box>
                          
                          <Typography
                            sx={{
                              color: colors.creamText,
                              fontSize: { xs: '0.82rem', sm: '0.88rem' },
                              lineHeight: 1.6,
                              opacity: 0.95,
                              mb: 2,
                            }}
                          >
                            {t('wedding.details.dressCodeNoteText')}
                          </Typography>

                          {/* Chips visuales de colores reservados */}
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
                            {[
                              { label: t('wedding.details.reservedColors.white'), color: '#FFFFFF' },
                            ].map((swatch, sIdx) => (
                              <Box
                                key={sIdx}
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  bgcolor: 'rgba(15, 31, 23, 0.7)',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  borderRadius: '20px',
                                  py: 0.6,
                                  px: 1.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    bgcolor: swatch.color,
                                    border: '1px solid rgba(0,0,0,0.2)',
                                    boxShadow: '0 0 4px rgba(255,255,255,0.4)',
                                    display: 'inline-block',
                                  }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    color: colors.sandBeige,
                                    textDecoration: 'line-through',
                                    textDecorationColor: '#e57373',
                                    textDecorationThickness: '1.5px',
                                  }}
                                >
                                  {swatch.label}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
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
                  bgcolor: 'rgba(20, 38, 29, 0.75)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid rgba(218, 188, 96, 0.35)`,
                  borderRadius: 3.5, 
                  p: { xs: 3, sm: 4.5 }, 
                  textAlign: 'center',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                }}
              >
                <Box 
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: '50%', 
                    bgcolor: 'rgba(218, 188, 96, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    mx: 'auto', 
                    mb: 2 
                  }}
                >
                  <HotelIcon sx={{ fontSize: 34, color: colors.goldAccent }} />
                </Box>

                <Chip 
                  label={t('wedding.accommodations.badge', 'Tarifa Especial para la Boda • Marriott')} 
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(218, 188, 96, 0.18)', 
                    color: colors.goldAccent, 
                    fontWeight: 700, 
                    letterSpacing: 1, 
                    fontSize: '0.75rem',
                    mb: 2,
                    border: '1px solid rgba(218, 188, 96, 0.4)'
                  }} 
                />

                <Typography 
                  variant="h4"
                  sx={{ 
                    fontFamily: "'Playfair Display', serif", 
                    fontWeight: 700, 
                    color: '#ffffff', 
                    fontSize: { xs: '1.4rem', sm: '1.8rem' },
                    mb: 1.5 
                  }}
                >
                  {t('wedding.accommodations.hotelName', 'Hotel Sheraton Presidente San Salvador')}
                </Typography>

                <Typography 
                  sx={{ 
                    color: colors.creamText, 
                    fontSize: { xs: '0.9rem', sm: '1rem' }, 
                    lineHeight: 1.8, 
                    maxWidth: 640, 
                    mx: 'auto',
                    opacity: 0.95,
                    mb: 3
                  }}
                >
                  {t('wedding.accommodations.a')}
                </Typography>

                <Button
                  variant="contained"
                  component="a"
                  href="https://www.marriott.com/es/event-reservations/reservation-link.mi?id=1790013727538&key=GRP"
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon />}
                  sx={{
                    bgcolor: colors.goldAccent,
                    color: '#15271e',
                    fontWeight: 700,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    letterSpacing: 0.5,
                    px: { xs: 3, sm: 4.5 },
                    py: 1.4,
                    borderRadius: '35px',
                    boxShadow: '0 6px 20px rgba(218, 188, 96, 0.35)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      bgcolor: '#f5d580',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(218, 188, 96, 0.45)',
                    }
                  }}
                >
                  {t('wedding.accommodations.buttonText', 'Reservar con Tarifa Especial')}
                </Button>

                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mt: 1.8, 
                    color: colors.goldAccent, 
                    opacity: 0.85, 
                    fontSize: '0.78rem' 
                  }}
                >
                  {t('wedding.accommodations.linkNote', 'Enlace directo oficial de Marriott para el grupo de la boda Shields-Urquilla')}
                </Typography>
              </Box>
            )}

            {/* PESTAÑA 3: PREGUNTAS FRECUENTES (FAQS) */}
            {activeGuideTab === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                {[
                  { q: t('wedding.faqs.whoIsTuty.q'), a: t('wedding.faqs.whoIsTuty.a'), defaultOpen: true },
                  { q: t('wedding.faqs.dietary.q'), a: t('wedding.faqs.dietary.a'), defaultOpen: true },
                  { q: t('wedding.faqs.kids.q'), a: t('wedding.faqs.kids.a'), defaultOpen: true },
                  { q: t('wedding.faqs.kidsFood.q'), a: t('wedding.faqs.kidsFood.a') },
                  { q: t('wedding.faqs.ceremonyPhotos.q'), a: t('wedding.faqs.ceremonyPhotos.a'), defaultOpen: true },
                  { q: t('wedding.faqs.receptionPhotos.q'), a: t('wedding.faqs.receptionPhotos.a') },
                  { q: t('wedding.faqs.rsvpDeadline.q'), a: t('wedding.faqs.rsvpDeadline.a') },
                  { q: t('wedding.faqs.djSongs.q'), a: t('wedding.faqs.djSongs.a') },
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
              {t('wedding.honeymoon.registryOverline', 'REGISTRO DE REGALOS')}
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

          {/* CUADRÍCULA DE EXPERIENCIAS (CSS GRID 100% HOMOGÉNEO: EXACTO MISMO ANCHO Y ALTO EN TODAS LAS PANTALLAS E IDIOMAS) */}
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                md: 'repeat(3, 1fr)' 
              }, 
              gap: 3, 
              alignItems: 'stretch',
              maxWidth: 1100, 
              mx: 'auto',
              width: '100%'
            }}
          >
            {honeymoonCards.map((item) => (
              <Box key={item.key} sx={{ display: 'flex', justifyContent: 'center', width: '100%', minWidth: 0 }}>
                <Card 
                  sx={{ 
                    width: '100%',
                    maxWidth: { xs: 380, md: 'none' },
                    height: 520,
                    minHeight: 520,
                    maxHeight: 520,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: '#ffffff',
                    border: `1px solid ${colors.sandBeige}`,
                    boxShadow: '0 8px 24px rgba(30, 56, 43, 0.06)',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                    minWidth: 0,
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 16px 36px rgba(30, 56, 43, 0.12)',
                      borderColor: colors.copper,
                    }
                  }}
                >
                  {/* Imagen fija con altura estricta */}
                  <Box sx={{ position: 'relative', overflow: 'hidden', height: 200, minHeight: 200, maxHeight: 200, flexShrink: 0, width: '100%' }}>
                    <Box 
                      component="img" 
                      src={item.image} 
                      alt={item.title}
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.5s ease',
                        '&:hover': { transform: 'scale(1.08)' }
                      }} 
                    />
                    <Chip 
                      label={`${t('wedding.honeymoon.experiencePrefix', 'EXPERIENCIA')} ${item.number}`}
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

                  {/* Cuerpo de la tarjeta con flexbox y dimensiones uniformes */}
                  <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1, textAlign: 'center', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                    
                    {/* Contenedor de Título con altura fija exacta (52px) */}
                    <Box sx={{ height: 52, minHeight: 52, maxHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1, overflow: 'hidden', flexShrink: 0, width: '100%', minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontFamily: "'Playfair Display', serif", 
                          color: colors.forestGreen, 
                          fontWeight: 700,
                          fontSize: { xs: '0.95rem', sm: '1.05rem' },
                          lineHeight: 1.25,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          width: '100%',
                          minWidth: 0,
                          wordBreak: 'break-word',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {item.title}
                      </Typography>
                    </Box>

                    {/* Contenedor de Descripción con altura fija exacta (84px) */}
                    <Box sx={{ height: 84, minHeight: 84, maxHeight: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, overflow: 'hidden', flexShrink: 0, width: '100%', minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666', 
                          fontSize: '0.8rem', 
                          lineHeight: 1.45, 
                          width: '100%',
                          minWidth: 0,
                          wordBreak: 'break-word',
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {item.description}
                      </Typography>
                    </Box>

                    {/* Contenedor inferior anclado en la misma posición (mt: 'auto') */}
                    <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid #f0e6d6', flexShrink: 0, width: '100%', minWidth: 0 }}>
                      <Box sx={{ height: 26, minHeight: 26, maxHeight: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5, width: '100%' }}>
                        <Typography 
                          sx={{ 
                            fontFamily: "'Montserrat', sans-serif", 
                            fontWeight: 700, 
                            color: colors.copper, 
                            fontSize: { xs: '0.82rem', sm: '0.86rem' }, 
                            letterSpacing: 0.5,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.shareText}
                        </Typography>
                      </Box>

                      <Box sx={{ height: 20, minHeight: 20, maxHeight: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, width: '100%' }}>
                        <Typography variant="caption" sx={{ color: '#888', display: 'block', fontSize: '0.78rem' }}>
                          {t('wedding.honeymoon.contributedCount', 'Aportadas: 0 • Meta: {{need}}', { need: item.need })}
                        </Typography>
                      </Box>

                      <Button 
                        fullWidth
                        variant="contained" 
                        onClick={() => handleOpenGiftModal(item.key, item)}
                        startIcon={<CardGiftcardIcon sx={{ fontSize: 18 }} />}
                        sx={{ 
                          bgcolor: colors.terracotta, 
                          color: '#ffffff', 
                          borderRadius: '25px', 
                          height: 40,
                          py: 0.8,
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

                  </Box>
                </Card>
              </Box>
            ))}
          </Box>

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
                  {t('wedding.honeymoon.customContribution.title')}
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
      <Box sx={{ bgcolor: colors.forestDark, color: 'rgba(255,255,255,0.7)', pt: 4, pb: 10, textAlign: 'center' }}>
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
        <Tooltip title={t('wedding.nav.rsvp', 'Confirmar Asistencia')}>
          <Button 
            onClick={() => scrollToSection('rsvp')}
            size="small"
            sx={{ 
              color: colors.sandBeige, 
              fontWeight: 700, 
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              letterSpacing: 1.2,
              borderRadius: '20px',
              px: { xs: 1.2, sm: 2 },
              '&:hover': { bgcolor: 'rgba(199, 120, 79, 0.2)' }
            }}
          >
            {t('wedding.nav.rsvp', 'RSVP')}
          </Button>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(199, 120, 79, 0.4)', height: 18, my: 'auto' }} />

        <Tooltip title={t('wedding.nav.guide', 'Ver Guía y Detalles')}>
          <Button 
            onClick={() => scrollToSection('guide', 0)}
            size="small"
            sx={{ 
              color: colors.sandBeige, 
              fontWeight: 700, 
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              letterSpacing: 1.2,
              borderRadius: '20px',
              px: { xs: 1.2, sm: 2 },
              '&:hover': { bgcolor: 'rgba(199, 120, 79, 0.2)' }
            }}
          >
            {t('wedding.nav.guide', 'Guía')}
          </Button>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(199, 120, 79, 0.4)', height: 18, my: 'auto' }} />

        <Tooltip title={t('wedding.nav.gifts', 'Fondo de Luna de Miel')}>
          <Button 
            onClick={() => scrollToSection('honeymoon')}
            size="small"
            sx={{ 
              color: colors.sandBeige, 
              fontWeight: 700, 
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              letterSpacing: 1.2,
              borderRadius: '20px',
              px: { xs: 1.2, sm: 2 },
              '&:hover': { bgcolor: 'rgba(199, 120, 79, 0.2)' }
            }}
          >
            {t('wedding.nav.gifts', 'Regalos')}
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
                      ? "Thank you so much for contributing to our Honeymoon!" 
                      : i18n.language.startsWith('fr')
                      ? "Merci infiniment pour votre participation à notre lune de miel !"
                      : "¡Muchísimas gracias por tu contribución a nuestra luna de miel!",
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
