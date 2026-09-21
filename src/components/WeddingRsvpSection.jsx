import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Collapse,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import SendIcon from '@mui/icons-material/Send';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useTranslation } from 'react-i18next';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const WeddingRsvpSection = ({ colors }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asistencia: 'si',
    numInvitados: 1,
    nombresAcompanantes: '',
    transporteShuttle: 'si',
    dieta: '',
    mensaje: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setErrorMessage(t('wedding.rsvpForm.nameRequired'));
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage(t('wedding.rsvpForm.emailRequired'));
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await addDoc(collection(db, 'rsvps_boda'), {
        nombre: formData.nombre.trim(),
        email: formData.email.trim().toLowerCase(),
        asistencia: formData.asistencia,
        total_invitados: formData.asistencia === 'si' ? Math.max(1, parseInt(formData.numInvitados) || 1) : 0,
        nombres_acompanantes: formData.asistencia === 'si' ? formData.nombresAcompanantes.trim() : '',
        shuttle: formData.asistencia === 'si' ? formData.transporteShuttle : 'no',
        dieta: formData.asistencia === 'si' ? formData.dieta.trim() : '',
        mensaje: formData.mensaje.trim(),
        creado_el: serverTimestamp(),
      });

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Error al guardar RSVP de boda:', err);
      setErrorMessage(`${t('wedding.rsvpForm.errorTitle')}: ${err.message}`);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      nombre: '',
      email: '',
      asistencia: 'si',
      numInvitados: 1,
      nombresAcompanantes: '',
      transporteShuttle: 'si',
      dieta: '',
      mensaje: '',
    });
    setSuccess(false);
    setErrorMessage('');
  };

  return (
    <Box id="rsvp" sx={{ bgcolor: colors.sandLight, py: { xs: 6, sm: 8 }, px: { xs: 2, sm: 3 } }}>
      <Container maxWidth="sm" sx={{ maxWidth: '680px !important' }}>
        {/* Encabezado Clásico y Solemne */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 4,
              fontWeight: 700,
              color: colors.copper,
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              display: 'block',
              mb: 1,
            }}
          >
            {t('wedding.rsvpForm.overline', "RÉPONDEZ S'IL VOUS PLAÎT")}
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontFamily: "'Playfair Display', serif",
              fontSize: { xs: '2.8rem', sm: '3.8rem', md: '4.4rem' },
              color: colors.forestGreen,
              letterSpacing: 4,
              lineHeight: 1.05,
              mb: 1.5,
            }}
          >
            {t('wedding.rsvpForm.title', 'RSVP')}
          </Typography>
          <Typography
            sx={{
              color: colors.charcoal,
              fontSize: { xs: '0.9rem', sm: '1.02rem' },
              maxWidth: 500,
              mx: 'auto',
              opacity: 0.85,
              lineHeight: 1.6,
            }}
          >
            {t('wedding.rsvpForm.subtitle')}
          </Typography>
        </Box>

        {/* Tarjeta del Formulario (Tarjeta Editorial de Boda) */}
        <Card
          sx={{
            bgcolor: '#ffffff',
            borderRadius: 3.5,
            boxShadow: '0 16px 48px rgba(30, 56, 43, 0.08), 0 2px 8px rgba(0,0,0,0.03)',
            border: `1px solid #ebdccb`,
            p: { xs: 3, sm: 4.5 },
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {success ? (
              <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 5 } }}>
                <Box
                  sx={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    bgcolor: 'rgba(30, 56, 43, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <FavoriteIcon sx={{ fontSize: 42, color: colors.copper }} />
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Playfair Display', serif",
                    color: colors.forestGreen,
                    fontSize: { xs: '1.8rem', sm: '2.4rem' },
                    mb: 1.5,
                  }}
                >
                  {t('wedding.rsvpForm.successTitle')}
                </Typography>
                <Typography
                  sx={{
                    color: colors.charcoal,
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    lineHeight: 1.7,
                    maxWidth: 500,
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  {t('wedding.rsvpForm.successText')}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  sx={{
                    color: colors.forestGreen,
                    borderColor: colors.copper,
                    borderRadius: '30px',
                    px: 3.5,
                    py: 1,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: colors.copperDark,
                      bgcolor: 'rgba(199, 120, 79, 0.08)',
                    },
                  }}
                >
                  {t('wedding.rsvpForm.anotherRsvp')}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
                {errorMessage && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {errorMessage}
                  </Alert>
                )}

                {/* Paso 1: Asistencia */}
                <Box sx={{ width: '100%' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      fontWeight: 700,
                      letterSpacing: 1,
                      color: colors.forestGreen,
                      textTransform: 'uppercase',
                      mb: 1.2,
                      fontSize: '0.8rem',
                    }}
                  >
                    {t('wedding.rsvpForm.attendance')} *
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 1.5,
                      width: '100%',
                    }}
                  >
                    {/* Opción Sí */}
                    <Box
                      onClick={() => handleChange('asistencia', 'si')}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        border: `2px solid ${formData.asistencia === 'si' ? colors.copper : '#e8ded4'}`,
                        bgcolor: formData.asistencia === 'si' ? 'rgba(199, 120, 79, 0.08)' : '#faf8f5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.25s ease',
                        boxSizing: 'border-box',
                        '&:hover': {
                          borderColor: colors.copper,
                          bgcolor: 'rgba(199, 120, 79, 0.04)',
                        },
                      }}
                    >
                      <CheckCircleOutlineIcon
                        sx={{
                          color: formData.asistencia === 'si' ? colors.copper : '#bbb',
                          fontSize: 24,
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: colors.forestGreen, fontSize: '0.92rem', lineHeight: 1.3 }}>
                          {t('wedding.rsvpForm.yes')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#777', display: 'block', lineHeight: 1.3, mt: 0.3 }}>
                          {t('wedding.rsvpForm.yesSubtitle', 'Celebraré con ustedes este día tan especial')}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Opción No */}
                    <Box
                      onClick={() => handleChange('asistencia', 'no')}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        border: `2px solid ${formData.asistencia === 'no' ? colors.copper : '#e8ded4'}`,
                        bgcolor: formData.asistencia === 'no' ? 'rgba(199, 120, 79, 0.08)' : '#faf8f5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.25s ease',
                        boxSizing: 'border-box',
                        '&:hover': {
                          borderColor: colors.copper,
                          bgcolor: 'rgba(199, 120, 79, 0.04)',
                        },
                      }}
                    >
                      <HighlightOffIcon
                        sx={{
                          color: formData.asistencia === 'no' ? '#c4513d' : '#bbb',
                          fontSize: 24,
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: colors.charcoal, fontSize: '0.92rem', lineHeight: 1.3 }}>
                          {t('wedding.rsvpForm.no')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#777', display: 'block', lineHeight: 1.3, mt: 0.3 }}>
                          {t('wedding.rsvpForm.noSubtitle', 'Los acompañaré desde la distancia')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Paso 2: Datos de Contacto (2 columnas simétricas al 100% del ancho) */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                    width: '100%',
                  }}
                >
                  <TextField
                    fullWidth
                    required
                    size="medium"
                    label={t('wedding.rsvpForm.fullName')}
                    value={formData.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: 2 },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.copper,
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    required
                    size="medium"
                    type="email"
                    label={t('wedding.rsvpForm.email')}
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: 2 },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.copper,
                      },
                    }}
                  />
                </Box>

                {/* Paso 3: Campos Condicionales de Asistencia */}
                <Collapse in={formData.asistencia === 'si'} sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', pt: 0.5 }}>
                    {/* Acompañantes */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '140px 1fr' },
                        gap: 2,
                        width: '100%',
                      }}
                    >
                      <TextField
                        fullWidth
                        size="medium"
                        type="number"
                        label={t('wedding.rsvpForm.guests')}
                        inputProps={{ min: 1, max: 10 }}
                        value={formData.numInvitados}
                        onChange={(e) => handleChange('numInvitados', e.target.value)}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: 2 },
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.copper,
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        size="medium"
                        label={t('wedding.rsvpForm.guestNames')}
                        value={formData.nombresAcompanantes}
                        onChange={(e) => handleChange('nombresAcompanantes', e.target.value)}
                        variant="outlined"
                        placeholder="Ej: Sofía Urquilla, Mateo Shields"
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: 2 },
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.copper,
                          },
                        }}
                      />
                    </Box>

                    {/* Selector de Shuttle Bus */}
                    <Box
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        borderRadius: 2.5,
                        bgcolor: '#faf8f5',
                        border: '1px solid #ebdccb',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DirectionsBusIcon sx={{ color: colors.copper, fontSize: 26, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: colors.forestGreen }}>
                            {t('wedding.rsvpForm.shuttle')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                            {t('wedding.rsvpForm.shuttleSubtitle', 'Transporte de ida y vuelta al lugar del evento')}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                          gap: 1.5,
                          width: '100%',
                        }}
                      >
                        <Button
                          fullWidth
                          size="medium"
                          variant={formData.transporteShuttle === 'si' ? 'contained' : 'outlined'}
                          onClick={() => handleChange('transporteShuttle', 'si')}
                          sx={{
                            borderRadius: '25px',
                            py: 1,
                            bgcolor: formData.transporteShuttle === 'si' ? colors.copper : 'transparent',
                            color: formData.transporteShuttle === 'si' ? '#fff' : colors.copper,
                            borderColor: colors.copper,
                            fontWeight: 600,
                            fontSize: '0.84rem',
                            '&:hover': {
                              bgcolor: formData.transporteShuttle === 'si' ? colors.copperDark : 'rgba(199, 120, 79, 0.08)',
                            },
                          }}
                        >
                          {t('wedding.rsvpForm.shuttleYes')}
                        </Button>
                        <Button
                          fullWidth
                          size="medium"
                          variant={formData.transporteShuttle === 'no' ? 'contained' : 'outlined'}
                          onClick={() => handleChange('transporteShuttle', 'no')}
                          sx={{
                            borderRadius: '25px',
                            py: 1,
                            bgcolor: formData.transporteShuttle === 'no' ? colors.forestGreen : 'transparent',
                            color: formData.transporteShuttle === 'no' ? '#fff' : colors.forestGreen,
                            borderColor: colors.forestGreen,
                            fontWeight: 600,
                            fontSize: '0.84rem',
                            '&:hover': {
                              bgcolor: formData.transporteShuttle === 'no' ? colors.forestDark : 'rgba(30, 56, 43, 0.08)',
                            },
                          }}
                        >
                          {t('wedding.rsvpForm.shuttleNo')}
                        </Button>
                      </Box>
                    </Box>

                    {/* Restricciones Dietéticas */}
                    <TextField
                      fullWidth
                      size="medium"
                      label={t('wedding.rsvpForm.dietary')}
                      placeholder={t('wedding.rsvpForm.dietaryPlaceholder')}
                      value={formData.dieta}
                      onChange={(e) => handleChange('dieta', e.target.value)}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: 2 },
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.copper,
                        },
                      }}
                    />
                  </Box>
                </Collapse>

                {/* Paso 4: Mensaje */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="medium"
                  label={t('wedding.rsvpForm.notes')}
                  placeholder={t('wedding.rsvpForm.notesPlaceholder')}
                  value={formData.mensaje}
                  onChange={(e) => handleChange('mensaje', e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.copper,
                    },
                  }}
                />

                {/* Paso 5: Botón de Enviar */}
                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    endIcon={!loading && <SendIcon />}
                    sx={{
                      bgcolor: colors.copper,
                      color: '#ffffff',
                      px: { xs: 4, sm: 6 },
                      py: 1.4,
                      borderRadius: '30px',
                      fontWeight: 700,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      letterSpacing: 1.5,
                      boxShadow: '0 6px 20px rgba(199, 120, 79, 0.3)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        bgcolor: colors.copperDark,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(199, 120, 79, 0.45)',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      t('wedding.rsvpForm.submit')
                    )}
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default WeddingRsvpSection;
