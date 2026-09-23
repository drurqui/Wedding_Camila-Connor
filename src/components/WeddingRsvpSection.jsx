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
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import SendIcon from '@mui/icons-material/Send';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import { db } from '../config/firebase';
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const normalize = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export const WeddingRsvpSection = ({ colors }) => {
  const { t, i18n } = useTranslation();

  // Paso actual del flujo (1: Búsqueda, 2: Selección por Invitado, 3: Éxito)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Paso 1: Datos de búsqueda
  const [searchData, setSearchData] = useState({ nombre: '', email: '' });

  // Paso 2: Invitación y lista de invitados
  const [invitacionMaster, setInvitacionMaster] = useState(null);
  const [guestList, setGuestList] = useState([]);
  const [shuttleSelection, setShuttleSelection] = useState('si');
  const [message, setMessage] = useState('');

  // Menús predeterminados preparados para la Boda en Forêt
  const menuOptions = [
    { key: 'beef', label: t('wedding.rsvpForm.step2.menuOptions.beef') },
    { key: 'salmon', label: t('wedding.rsvpForm.step2.menuOptions.salmon') },
    { key: 'vegetarian', label: t('wedding.rsvpForm.step2.menuOptions.vegetarian') },
    { key: 'kids', label: t('wedding.rsvpForm.step2.menuOptions.kids') },
  ];

  // Búsqueda de invitación maestra en Firestore (invitaciones_boda)
  const handleSearchInvitation = async (e) => {
    if (e) e.preventDefault();
    if (!searchData.nombre.trim() && !searchData.email.trim()) {
      setErrorMessage(t('wedding.rsvpForm.step1.notFound'));
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const snap = await getDocs(collection(db, "invitaciones_boda"));
      const buscado = normalize(searchData.nombre);
      const inputEmail = searchData.email.toLowerCase().trim();

      let matchByEmail = null;
      let matchIdByEmail = null;
      const matchesByName = [];

      snap.forEach(documento => {
        const data = documento.data();
        if (inputEmail && data.email_vinculado && data.email_vinculado.toLowerCase() === inputEmail) {
          matchByEmail = data;
          matchIdByEmail = documento.id;
        }
        if (buscado) {
          const enLista = data.invitados?.some(i => normalize(i.nombre).includes(buscado));
          if (normalize(data.nombre_invitacion || '').includes(buscado) || enLista) {
            matchesByName.push({ id: documento.id, data: data });
          }
        }
      });

      let match = null;
      let matchId = null;

      if (matchByEmail) {
        match = matchByEmail;
        matchId = matchIdByEmail;
      } else {
        if (matchesByName.length === 0) {
          setErrorMessage(t('wedding.rsvpForm.step1.notFound'));
          setLoading(false);
          return;
        } else if (matchesByName.length > 1) {
          setErrorMessage(t('wedding.rsvpForm.step1.multipleFound'));
          setLoading(false);
          return;
        } else {
          match = matchesByName[0].data;
          matchId = matchesByName[0].id;
        }
      }

      if (match) {
        // Consultar si ya existe un RSVP previo para esta invitación
        const rsvpRef = doc(db, "rsvps_boda", matchId);
        const rsvpSnap = await getDoc(rsvpRef);
        const rsvpData = rsvpSnap.exists() ? rsvpSnap.data() : null;

        // Mezclar invitados de la lista maestra con posibles respuestas previas
        const mergedGuests = (match.invitados || []).map(invMaster => {
          const prevResp = rsvpData?.invitados?.find(r => normalize(r.nombre) === normalize(invMaster.nombre));
          if (prevResp) {
            return {
              ...invMaster,
              asistencia: prevResp.asistencia || 'si',
              menu: prevResp.menu || t('wedding.rsvpForm.step2.menuPendingStatus'),
              alergias: prevResp.alergias || '',
            };
          } else {
            return {
              ...invMaster,
              asistencia: 'si',
              menu: t('wedding.rsvpForm.step2.menuPendingStatus'),
              alergias: '',
            };
          }
        });

        if (rsvpData?.shuttle) {
          setShuttleSelection(rsvpData.shuttle);
        }
        if (rsvpData?.mensaje) {
          setMessage(rsvpData.mensaje);
        }

        setInvitacionMaster({
          id: matchId,
          nombre_invitacion: match.nombre_invitacion,
          email: inputEmail || match.email_vinculado || '',
        });
        setGuestList(mergedGuests);
        setStep(2);
      }
    } catch (err) {
      console.error("Error al buscar invitación de boda:", err);
      setErrorMessage(t('wedding.rsvpForm.step2.saveError'));
    }
    setLoading(false);
  };

  const handleGuestChange = (index, field, value) => {
    const updated = [...guestList];
    updated[index][field] = value;
    setGuestList(updated);
  };

  const handleSubmitRSVP = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    setLoading(true);

    const attendingGuests = guestList.filter(g => g.asistencia === 'si');
    const algunAsistente = attendingGuests.length > 0;
    const finalGuests = guestList.map(g => (
      g.asistencia === 'no' 
        ? { ...g, menu: '—', alergias: '' } 
        : { ...g, menu: g.menu || t('wedding.rsvpForm.step2.menuPendingStatus', 'Pendiente de definir') }
    ));

    try {
      const targetEmail = (invitacionMaster.email || searchData.email || '').toLowerCase().trim();

      await setDoc(doc(db, "rsvps_boda", invitacionMaster.id), {
        invitacion_id: invitacionMaster.id,
        nombre_invitacion: invitacionMaster.nombre_invitacion,
        email: targetEmail,
        asistencia: algunAsistente ? 'si' : 'no',
        total_invitados: attendingGuests.length,
        invitados: finalGuests,
        shuttle: algunAsistente ? shuttleSelection : 'no',
        mensaje: message.trim(),
        actualizado_el: serverTimestamp(),
      }, { merge: true });

      // Enviar correo de confirmación con diseño nupcial vía backend
      if (targetEmail) {
        const backendBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:8080'
          : 'https://api-boda-736009271165.us-central1.run.app';

        fetch(`${backendBase}/enviar-confirmacion-rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            nombre_invitacion: invitacionMaster.nombre_invitacion,
            asistencia: algunAsistente ? 'si' : 'no',
            total_invitados: attendingGuests.length,
            invitados: finalGuests,
            shuttle: algunAsistente ? shuttleSelection : 'no',
            mensaje: message.trim(),
            idioma: i18n.language || 'es'
          })
        }).catch(emailErr => {
          console.warn("No se pudo enviar el correo de confirmación automático:", emailErr);
        });
      }

      setStep(3);
    } catch (err) {
      console.error("Error al guardar RSVP de boda:", err);
      setErrorMessage(t('wedding.rsvpForm.step2.saveError'));
    }
    setLoading(false);
  };

  const handleReset = () => {
    setStep(1);
    setSearchData({ nombre: '', email: '' });
    setInvitacionMaster(null);
    setGuestList([]);
    setMessage('');
    setErrorMessage('');
  };

  return (
    <Box id="rsvp" sx={{ bgcolor: colors.sandLight, py: { xs: 6, sm: 8 }, px: { xs: 2, sm: 3 } }}>
      <Container maxWidth="md" sx={{ maxWidth: '780px !important' }}>
        
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
              color: '#444',
              fontSize: { xs: '0.9rem', sm: '1.02rem' },
              maxWidth: 540,
              mx: 'auto',
              opacity: 0.9,
              lineHeight: 1.6,
            }}
          >
            {t('wedding.rsvpForm.subtitle')}
          </Typography>
        </Box>

        {/* Tarjeta Editorial de RSVP */}
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

            {/* ======================================================== */}
            {/* PASO 1: BÚSQUEDA DE INVITACIÓN                           */}
            {/* ======================================================== */}
            {step === 1 && (
              <Box component="form" onSubmit={handleSearchInvitation}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "'Playfair Display', serif",
                      color: colors.forestGreen,
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {t('wedding.rsvpForm.step1.title')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', maxWidth: 480, mx: 'auto' }}>
                    {t('wedding.rsvpForm.step1.subtitle')}
                  </Typography>
                </Box>

                {errorMessage && (
                  <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                    {errorMessage}
                  </Alert>
                )}

                <Box sx={{ maxWidth: 460, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                  <TextField
                    fullWidth
                    label={t('wedding.rsvpForm.step1.nameLabel')}
                    placeholder={t('wedding.rsvpForm.step1.namePlaceholder')}
                    value={searchData.nombre}
                    onChange={(e) => setSearchData({ ...searchData, nombre: e.target.value })}
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    type="email"
                    label={t('wedding.rsvpForm.step1.emailLabel')}
                    placeholder={t('wedding.rsvpForm.step1.emailPlaceholder')}
                    value={searchData.email}
                    onChange={(e) => setSearchData({ ...searchData, email: e.target.value })}
                    variant="outlined"
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                    sx={{
                      mt: 1,
                      py: 1.5,
                      bgcolor: colors.forestGreen,
                      color: '#ffffff',
                      borderRadius: '30px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      letterSpacing: 0.5,
                      '&:hover': { bgcolor: colors.forestGreenLight },
                    }}
                  >
                    {loading ? t('wedding.rsvpForm.step1.searching') : t('wedding.rsvpForm.step1.searchButton')}
                  </Button>
                </Box>
              </Box>
            )}

            {/* ======================================================== */}
            {/* PASO 2: FORMULARIO MULTI-INVITADO (ASISTENCIA, MENÚ, ETC) */}
            {/* ======================================================== */}
            {step === 2 && (
              <Box component="form" onSubmit={handleSubmitRSVP}>
                
                {/* Badge Superior de Titular */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    bgcolor: 'rgba(30, 56, 43, 0.05)',
                    p: 2,
                    borderRadius: 2.5,
                    mb: 3.5,
                    border: '1px solid rgba(199, 120, 79, 0.25)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: colors.copper }} />
                    <Typography variant="body2" sx={{ color: '#444' }}>
                      {t('wedding.rsvpForm.step2.guestLabel')}{' '}
                      <strong style={{ color: colors.forestGreen, fontSize: '1rem' }}>
                        {invitacionMaster?.nombre_invitacion}
                      </strong>
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => setStep(1)}
                    sx={{ color: colors.copper, textTransform: 'none', fontWeight: 600 }}
                  >
                    {t('wedding.rsvpForm.step2.changeButton')}
                  </Button>
                </Box>

                <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                  {t('wedding.rsvpForm.step2.instructions')}
                </Typography>

                {errorMessage && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {errorMessage}
                  </Alert>
                )}

                {/* Aviso informativo de Selección de Menú */}
                <Box
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    mb: 3.5,
                    borderRadius: 2.5,
                    bgcolor: '#f5f7f5',
                    border: '1px solid #c9d8ce',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.8,
                  }}
                >
                  <RestaurantMenuIcon sx={{ color: colors.forestGreen, fontSize: 26, mt: 0.2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.forestGreen, fontWeight: 700, fontSize: '0.98rem', mb: 0.5 }}>
                      {t('wedding.rsvpForm.step2.menuNoticeTitle')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4a5b50', lineHeight: 1.6, fontSize: '0.9rem' }}>
                      {t('wedding.rsvpForm.step2.menuNoticeText')}
                    </Typography>
                  </Box>
                </Box>

                {/* Tarjetas por cada Invitado */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
                  {guestList.map((guest, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: { xs: 2.5, sm: 3 },
                        borderRadius: 3,
                        border: '1px solid #e0d7cd',
                        bgcolor: guest.asistencia === 'si' ? '#fcfbf9' : '#fafafa',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Cabecera del Invitado */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ color: colors.forestGreen, fontWeight: 700, fontSize: '1.05rem' }}>
                            {guest.nombre}
                          </Typography>
                          <Chip
                            label={guest.tipo === 'niño' ? t('wedding.rsvpForm.step2.childBadge') : t('wedding.rsvpForm.step2.adultBadge')}
                            size="small"
                            sx={{
                              bgcolor: guest.tipo === 'niño' ? '#fbf3ea' : '#edf2ee',
                              color: guest.tipo === 'niño' ? colors.copper : colors.forestGreen,
                              fontWeight: 600,
                              fontSize: '0.72rem',
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Selector de Asistencia */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {t('wedding.rsvpForm.step2.attendanceQuestion')}
                        </Typography>
                        <RadioGroup
                          row
                          value={guest.asistencia}
                          onChange={(e) => handleGuestChange(idx, 'asistencia', e.target.value)}
                        >
                          <FormControlLabel
                            value="si"
                            control={<Radio sx={{ color: colors.forestGreen, '&.Mui-checked': { color: colors.forestGreen } }} />}
                            label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>{t('wedding.rsvpForm.step2.attendYes')}</Typography>}
                          />
                          <FormControlLabel
                            value="no"
                            control={<Radio sx={{ color: '#888', '&.Mui-checked': { color: '#d32f2f' } }} />}
                            label={<Typography variant="body2" sx={{ color: '#777' }}>{t('wedding.rsvpForm.step2.attendNo')}</Typography>}
                          />
                        </RadioGroup>
                      </Box>

                      {/* Campos condicionales si asiste */}
                      {guest.asistencia === 'si' && (
                        <Box sx={{ pt: 1.5, borderTop: '1px dashed #e4dcd3', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* Declaración de Alergias o Restricciones */}
                          <TextField
                            fullWidth
                            size="small"
                            label={t('wedding.rsvpForm.step2.allergiesLabel')}
                            placeholder={t('wedding.rsvpForm.step2.allergiesPlaceholder')}
                            value={guest.alergias || ''}
                            onChange={(e) => handleGuestChange(idx, 'alergias', e.target.value)}
                          />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>

                {/* Preguntas Generales para la Invitación */}
                <Box sx={{ p: 3, borderRadius: 3, bgcolor: '#fbf9f6', border: '1px solid #e8decb', mb: 4 }}>
                  {/* Shuttle Bus */}
                  <Typography variant="subtitle2" sx={{ color: colors.forestGreen, fontWeight: 700, mb: 1 }}>
                    🚌 {t('wedding.rsvpForm.step2.shuttleTitle')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#555', mb: 1.5 }}>
                    {t('wedding.rsvpForm.step2.shuttleQuestion')}
                  </Typography>
                  <RadioGroup
                    value={shuttleSelection}
                    onChange={(e) => setShuttleSelection(e.target.value)}
                    sx={{ mb: 3 }}
                  >
                    <FormControlLabel
                      value="si"
                      control={<Radio sx={{ color: colors.copper, '&.Mui-checked': { color: colors.copper } }} />}
                      label={<Typography variant="body2">{t('wedding.rsvpForm.step2.shuttleYes')}</Typography>}
                    />
                    <FormControlLabel
                      value="no"
                      control={<Radio sx={{ color: '#888', '&.Mui-checked': { color: colors.copper } }} />}
                      label={<Typography variant="body2">{t('wedding.rsvpForm.step2.shuttleNo')}</Typography>}
                    />
                  </RadioGroup>

                  {/* Mensaje para los novios */}
                  <Typography variant="subtitle2" sx={{ color: colors.forestGreen, fontWeight: 700, mb: 1 }}>
                    💌 {t('wedding.rsvpForm.step2.messageTitle')}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder={t('wedding.rsvpForm.step2.messagePlaceholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    sx={{ bgcolor: '#ffffff' }}
                  />
                </Box>

                {/* Botón Guardar / Confirmar */}
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={22} color="inherit" /> : <SendIcon />}
                  sx={{
                    py: 1.8,
                    bgcolor: colors.forestGreen,
                    color: '#ffffff',
                    borderRadius: '35px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: 0.5,
                    boxShadow: '0 8px 24px rgba(30, 56, 43, 0.2)',
                    '&:hover': { bgcolor: colors.forestGreenLight },
                  }}
                >
                  {loading ? t('wedding.rsvpForm.step2.submitting') : t('wedding.rsvpForm.step2.submitButton')}
                </Button>
              </Box>
            )}

            {/* ======================================================== */}
            {/* PASO 3: CONFIRMACIÓN EXITOSA                            */}
            {/* ======================================================== */}
            {step === 3 && (
              <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 4 } }}>
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
                    mb: 2.5,
                  }}
                >
                  <FavoriteIcon sx={{ fontSize: 42, color: colors.copper }} />
                </Box>

                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Playfair Display', serif",
                    color: colors.forestGreen,
                    fontSize: { xs: '1.9rem', sm: '2.5rem' },
                    mb: 1.5,
                  }}
                >
                  {t('wedding.rsvpForm.step3.title')}
                </Typography>

                <Typography
                  sx={{
                    color: '#555',
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    lineHeight: 1.7,
                    maxWidth: 540,
                    mx: 'auto',
                    mb: 3.5,
                  }}
                >
                  {t('wedding.rsvpForm.step3.subtitle')}
                </Typography>

                {/* Resumen de Confirmación */}
                <Box
                  sx={{
                    maxWidth: 500,
                    mx: 'auto',
                    p: 3,
                    borderRadius: 3,
                    bgcolor: '#faf8f5',
                    border: '1px solid #ebdccb',
                    textAlign: 'left',
                    mb: 4,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: colors.copper, fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {t('wedding.rsvpForm.step3.summaryTitle')}
                  </Typography>

                  <Typography variant="caption" sx={{ color: '#777', fontWeight: 600, display: 'block', mb: 1 }}>
                    {t('wedding.rsvpForm.step3.attendingGuests')}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {guestList.filter(g => g.asistencia === 'si').map((g, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.forestGreen }}>
                          ✓ {g.nombre}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {g.menu}
                        </Typography>
                      </Box>
                    ))}
                    {guestList.filter(g => g.asistencia === 'si').length === 0 && (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#999' }}>
                        Ninguno
                      </Typography>
                    )}
                  </Box>

                  {guestList.filter(g => g.asistencia === 'no').length > 0 && (
                    <>
                      <Typography variant="caption" sx={{ color: '#777', fontWeight: 600, display: 'block', mb: 1 }}>
                        {t('wedding.rsvpForm.step3.declinedGuests')}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {guestList.filter(g => g.asistencia === 'no').map((g, i) => (
                          <Typography key={i} variant="body2" sx={{ color: '#888' }}>
                            ✕ {g.nombre}
                          </Typography>
                        ))}
                      </Box>
                    </>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#777', fontWeight: 600 }}>
                      {t('wedding.rsvpForm.step3.shuttleStatus')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: colors.forestGreen }}>
                      {shuttleSelection === 'si' ? t('wedding.rsvpForm.step3.shuttleConfirmed') : t('wedding.rsvpForm.step3.shuttleDeclined')}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="outlined"
                  onClick={() => setStep(2)}
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
                  {t('wedding.rsvpForm.step3.modifyButton')}
                </Button>
              </Box>
            )}

          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default WeddingRsvpSection;
