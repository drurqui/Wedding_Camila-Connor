import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
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
        num_invitados: formData.asistencia === 'si' ? Math.max(1, parseInt(formData.numInvitados) || 1) : 0,
        nombres_acompanantes: formData.asistencia === 'si' ? formData.nombresAcompanantes.trim() : '',
        transporte_shuttle: formData.asistencia === 'si' ? formData.transporteShuttle : 'no',
        dieta: formData.asistencia === 'si' ? formData.dieta.trim() : '',
        mensaje: formData.mensaje.trim(),
        fecha: serverTimestamp(),
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
    <Box id="rsvp" sx={{ bgcolor: colors.sandLight, py: 10, px: { xs: 2, sm: 3, md: 4 } }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: "'Playfair Display', serif",
              fontSize: { xs: '2.4rem', md: '3.6rem' },
              color: colors.forestGreen,
              letterSpacing: 2,
              textTransform: 'uppercase',
              mb: 1,
            }}
          >
            {t('wedding.rsvpForm.title')}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Monsieur La Doulaise', cursive",
              fontSize: { xs: '2.8rem', md: '3.8rem' },
              color: colors.copper,
              mt: -1,
              mb: 2,
            }}
          >
            RSVP
          </Typography>
          <Typography
            sx={{
              color: colors.charcoal,
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              maxWidth: 600,
              mx: 'auto',
              opacity: 0.85,
            }}
          >
            {t('wedding.rsvpForm.subtitle')}
          </Typography>
        </Box>

        <Card
          sx={{
            bgcolor: '#ffffff',
            borderRadius: 3,
            boxShadow: '0 12px 36px rgba(30, 56, 43, 0.08)',
            border: `1px solid ${colors.sandBeige}`,
            p: { xs: 3, md: 5 },
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {success ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 72, color: colors.copper, mb: 2 }} />
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Playfair Display', serif",
                    color: colors.forestGreen,
                    mb: 2,
                  }}
                >
                  {t('wedding.rsvpForm.successTitle')}
                </Typography>
                <Typography
                  sx={{
                    color: colors.charcoal,
                    fontSize: '1.05rem',
                    lineHeight: 1.8,
                    maxWidth: 550,
                    mx: 'auto',
                    mb: 4,
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
                    px: 4,
                    py: 1,
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
              <Box component="form" onSubmit={handleSubmit}>
                {errorMessage && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {errorMessage}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label={t('wedding.rsvpForm.fullName')}
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.copper,
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      type="email"
                      label={t('wedding.rsvpForm.email')}
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.copper,
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl component="fieldset" fullWidth sx={{ mt: 1 }}>
                      <FormLabel
                        component="legend"
                        sx={{
                          color: colors.forestGreen,
                          fontWeight: 600,
                          mb: 1,
                          fontSize: '1rem',
                          '&.Mui-focused': { color: colors.forestGreen },
                        }}
                      >
                        {t('wedding.rsvpForm.attendance')}
                      </FormLabel>
                      <RadioGroup
                        row
                        value={formData.asistencia}
                        onChange={(e) => handleChange('asistencia', e.target.value)}
                      >
                        <FormControlLabel
                          value="si"
                          control={<Radio sx={{ color: colors.copper, '&.Mui-checked': { color: colors.copper } }} />}
                          label={t('wedding.rsvpForm.yes')}
                        />
                        <FormControlLabel
                          value="no"
                          control={<Radio sx={{ color: colors.copper, '&.Mui-checked': { color: colors.copper } }} />}
                          label={t('wedding.rsvpForm.no')}
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  {formData.asistencia === 'si' && (
                    <>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label={t('wedding.rsvpForm.guests')}
                          inputProps={{ min: 1, max: 10 }}
                          value={formData.numInvitados}
                          onChange={(e) => handleChange('numInvitados', e.target.value)}
                          variant="outlined"
                        />
                      </Grid>

                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          label={t('wedding.rsvpForm.guestNames')}
                          value={formData.nombresAcompanantes}
                          onChange={(e) => handleChange('nombresAcompanantes', e.target.value)}
                          variant="outlined"
                          placeholder="Ej: Sofía Urquilla, Mateo Shields"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormControl component="fieldset" fullWidth>
                          <FormLabel
                            component="legend"
                            sx={{
                              color: colors.forestGreen,
                              fontWeight: 600,
                              mb: 1,
                              fontSize: '0.95rem',
                              '&.Mui-focused': { color: colors.forestGreen },
                            }}
                          >
                            {t('wedding.rsvpForm.shuttle')}
                          </FormLabel>
                          <RadioGroup
                            row
                            value={formData.transporteShuttle}
                            onChange={(e) => handleChange('transporteShuttle', e.target.value)}
                          >
                            <FormControlLabel
                              value="si"
                              control={<Radio sx={{ color: colors.copper, '&.Mui-checked': { color: colors.copper } }} />}
                              label={t('wedding.rsvpForm.shuttleYes')}
                            />
                            <FormControlLabel
                              value="no"
                              control={<Radio sx={{ color: colors.copper, '&.Mui-checked': { color: colors.copper } }} />}
                              label={t('wedding.rsvpForm.shuttleNo')}
                            />
                          </RadioGroup>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label={t('wedding.rsvpForm.dietary')}
                          placeholder={t('wedding.rsvpForm.dietaryPlaceholder')}
                          value={formData.dieta}
                          onChange={(e) => handleChange('dieta', e.target.value)}
                          variant="outlined"
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label={t('wedding.rsvpForm.notes')}
                      placeholder={t('wedding.rsvpForm.notesPlaceholder')}
                      value={formData.mensaje}
                      onChange={(e) => handleChange('mensaje', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      size="large"
                      sx={{
                        bgcolor: colors.terracotta,
                        color: '#ffffff',
                        px: 6,
                        py: 1.5,
                        borderRadius: '30px',
                        fontWeight: 600,
                        fontSize: '1rem',
                        letterSpacing: 1,
                        boxShadow: '0 6px 20px rgba(199, 120, 79, 0.35)',
                        '&:hover': {
                          bgcolor: colors.copperDark,
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
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default WeddingRsvpSection;
