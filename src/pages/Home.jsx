import React, { useState } from 'react';
import { Box, Container, Typography, Card, TextField, Button, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert, Grid, Chip, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useTranslation } from 'react-i18next';

const normalize = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const Home = () => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ open: false, message: '' });
  const [loginData, setLoginData] = useState({ nombre: '', email: '' });
  const [invitacionMaster, setInvitacionMaster] = useState(null);
  const [guestList, setGuestList] = useState([]);

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(nextLang);
  };

  const handleLogin = async () => {
    if (!loginData.nombre || !loginData.email) { setAlertModal({ open: true, message: t('home.alerts.emptyFields') }); return; }
    setLoading(true);

    try {
      const snap = await getDocs(collection(db, "invitaciones"));
      const buscado = normalize(loginData.nombre);
      const inputEmail = loginData.email.toLowerCase().trim();

      let matchByEmail = null; let matchIdByEmail = null; let matchesByName = [];

      snap.forEach(documento => {
        const data = documento.data();
        if (data.email_vinculado && data.email_vinculado.toLowerCase() === inputEmail) { matchByEmail = data; matchIdByEmail = documento.id; }
        const enLista = data.invitados.some(i => normalize(i.nombre).includes(buscado));
        if (normalize(data.nombre_invitacion).includes(buscado) || enLista) { matchesByName.push({ id: documento.id, data: data }); }
      });

      let match = null; let matchId = null;

      if (matchByEmail) { match = matchByEmail; matchId = matchIdByEmail; } 
      else {
        if (matchesByName.length === 0) { setAlertModal({ open: true, message: t('home.alerts.notFound') }); setLoading(false); return; } 
        else if (matchesByName.length > 1) { setAlertModal({ open: true, message: t('home.alerts.multipleMatches') }); setLoading(false); return; } 
        else { match = matchesByName[0].data; matchId = matchesByName[0].id; }
      }

      if (match) {
        if (!match.email_vinculado) await setDoc(doc(db, "invitaciones", matchId), { email_vinculado: inputEmail }, { merge: true });
        const rsvpRef = doc(db, "rsvps_compromiso", inputEmail);
        const rsvpSnap = await getDoc(rsvpRef);
        const rsvpData = rsvpSnap.exists() ? rsvpSnap.data() : null;

        const mergedGuests = match.invitados.map(invMaster => {
          let respuestaPrevia = rsvpData?.invitados?.find(r => normalize(r.nombre) === normalize(invMaster.nombre));
          if (respuestaPrevia) {
            if (respuestaPrevia.tipo !== invMaster.tipo) { return { ...invMaster, asistencia: respuestaPrevia.asistencia || 'si', dieta: respuestaPrevia.dieta || 'None', starter: invMaster.tipo === 'niño' ? 'Menú Infantil' : '', entree: invMaster.tipo === 'niño' ? 'Menú Infantil' : '' }; }
            return { ...invMaster, ...respuestaPrevia };
          } else { const isNino = invMaster.tipo === 'niño'; return { ...invMaster, asistencia: 'si', dieta: 'None', starter: isNino ? 'Menú Infantil' : '', entree: isNino ? 'Menú Infantil' : '' }; }
        });

        setInvitacionMaster({ id: matchId, nombre_invitacion: match.nombre_invitacion, email: inputEmail });
        setGuestList(mergedGuests); setStep(2);
      }
    } catch (e) { setAlertModal({ open: true, message: t('home.alerts.connectionError') }); }
    setLoading(false);
  };

  const handleGuestChange = (index, field, value) => { const newList = [...guestList]; newList[index][field] = value; setGuestList(newList); };

  const submitRSVP = async () => {
    setLoading(true);
    let algunAsistente = false;
    for (const g of guestList) { if (g.asistencia === 'si') { algunAsistente = true; if (!g.starter || !g.entree) { setAlertModal({ open: true, message: t('home.alerts.missingMenu', { name: g.nombre }) }); setLoading(false); window.scrollTo(0, 0); return; } } }
    const finalGuests = guestList.map(g => g.asistencia === 'no' ? { ...g, dieta: 'None', starter: '', entree: '' } : g);
    const asistenciaGeneral = algunAsistente ? 'si' : 'no';
    try {
      await setDoc(doc(db, "rsvps_compromiso", invitacionMaster.email), { nombre: invitacionMaster.nombre_invitacion, email: invitacionMaster.email, asistencia: asistenciaGeneral, invitados: finalGuests, fecha: serverTimestamp() }, { merge: true });
      setStep(3); window.scrollTo(0, 0);
    } catch (e) { setAlertModal({ open: true, message: t('home.alerts.saveError') }); }
    setLoading(false);
  };

  if (step === 3) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
        <Typography variant="h1" sx={{ fontSize: { xs: '5rem', md: '8rem' }, color: 'primary.main', mb: 2 }}>{t('home.step3.title')}</Typography>
        <Typography variant="body1" sx={{ maxWidth: 600, mb: 4, color: 'text.secondary' }}>{t('home.step3.subtitle')}</Typography>
        <Button variant="outlined" color="primary" onClick={() => window.location.reload()}>{t('home.step3.button')}</Button>
      </Box>
    );
  }

  const cardStyle = { p: { xs: 4, md: 6 }, mb: 4, borderRadius: 2, border: '1px solid #711c2e', boxShadow: 'none', bgcolor: '#ffffff', width: '100%', maxWidth: '800px', mx: 'auto' };

  return (
    <Box>
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <Button variant="contained" color="secondary" onClick={toggleLanguage} sx={{ borderRadius: '20px', minWidth: 'auto', fontWeight: 'bold' }}>
          {t('common.changeLanguage')}
        </Button>
      </Box>

      <Box sx={{ height: '50vh', backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/hampton_court.webp')`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', overflow: 'hidden' }}>
        <Typography variant="h1" color="white" sx={{ fontSize: 'clamp(4.5rem, 12vw, 9rem)', lineHeight: 0.9, mt: 4, textAlign: 'center' }}>{t('home.hero.title')}</Typography>
        <Typography sx={{ letterSpacing: 3, mt: 3, fontSize: { xs: '0.8rem', sm: '1rem' }, textAlign: 'center' }}>{t('home.hero.subtitle')}</Typography>
        <Typography variant="h4" sx={{ mt: 1, color: 'secondary.main', fontSize: { xs: '1rem', sm: '1.2rem' }, textAlign: 'center' }}>{t('home.hero.date')}</Typography>
      </Box>

      <Container maxWidth="md" sx={{ mt: -8, mb: 10, position: 'relative', zIndex: 10 }}>
        {step === 1 && (
          <Card sx={cardStyle}>
            <Typography variant="h2" color="secondary" sx={{ textAlign: 'center', fontSize: { xs: '4rem', md: '5.5rem' }, mb: 1, lineHeight: 1 }}>{t('home.step1.title')}</Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', mb: 5, color: 'text.secondary', fontSize: '1rem' }}>{t('home.step1.subtitle')}</Typography>
            <Box sx={{ maxWidth: 450, margin: '0 auto' }}>
              <TextField fullWidth label={t('home.step1.nameLabel')} variant="outlined" margin="normal" value={loginData.nombre} onChange={(e) => setLoginData({...loginData, nombre: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              <TextField fullWidth label={t('home.step1.emailLabel')} variant="outlined" margin="normal" type="email" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={loading} sx={{ mt: 4, py: 1.5, bgcolor: '#dabc60', color: 'white', '&:hover': { bgcolor: '#c2a550' } }}>{loading ? <CircularProgress size={24} color="inherit" /> : t('home.step1.button')}</Button>
            </Box>
          </Card>
        )}

        {step === 2 && (
          <Box sx={{ maxWidth: '800px', mx: 'auto', position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: -50, right: 16, zIndex: 20 }}><Box sx={{ bgcolor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '30px', px: 2, py: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'inline-flex', alignItems: 'center' }}><Typography variant="body2" sx={{ color: '#666', mr: 1 }}>{t('home.step2.guestLabel')}<strong style={{ color: '#dabc60', fontWeight: 600 }}>{invitacionMaster?.nombre_invitacion}</strong></Typography><Typography component="button" onClick={() => setStep(1)} sx={{ color: '#999', fontSize: '0.8rem', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer', p: 0 }}>{t('home.step2.changeButton')}</Typography></Box></Box>
            <Card sx={cardStyle}>
              <Typography sx={{ color: '#711c2e', fontFamily: "'Playfair Display', serif", mb: 3, textAlign: 'center', lineHeight: 1.4, fontSize: { xs: '1.5rem', md: '2rem' } }}>{t('home.step2.welcomeLine1')}<br />{t('home.step2.welcomeLine2')}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}><img src="/POW-FALL.jpeg" alt="Prince of Wales Hotel" style={{ width: '100%', maxWidth: '450px', borderRadius: '8px' }} /></Box>
              <Typography sx={{ color: '#888', mb: 5, lineHeight: 1.8, textAlign: 'center', fontSize: '0.9rem', maxWidth: 650, mx: 'auto' }}>{t('home.step2.description')}</Typography>
              <Box sx={{ border: '1px dashed #711c2e', borderRadius: 2, maxWidth: 400, mx: 'auto', p: 3, textAlign: 'center' }}>
                <Typography sx={{ color: '#711c2e', fontWeight: 600, fontSize: '1rem', mb: 1 }}>{t('home.step2.eventDate')}</Typography>
                <Typography sx={{ color: '#666', mb: 0.5, fontSize: '0.9rem' }}>{t('home.step2.eventRoom')}</Typography>
                <Typography sx={{ color: '#666', mb: 0.5, fontSize: '0.9rem' }}>{t('home.step2.eventHotel')}</Typography>
                <Typography sx={{ color: '#666', mb: 2, fontSize: '0.9rem' }}>{t('home.step2.eventCity')}</Typography>
                <Typography sx={{ color: '#333', fontWeight: 600, mb: 2 }}>{t('home.step2.eventTime')}</Typography>
                <Typography sx={{ color: '#999', fontStyle: 'italic', fontSize: '0.85rem' }}>{t('home.step2.dressCode')}</Typography>
              </Box>
            </Card>
            <Card sx={cardStyle}>
              <Typography variant="h2" color="secondary" sx={{ textAlign: 'center', mb: 1, fontSize: { xs: '3.5rem', md: '4.5rem' } }}>{t('home.step2.rsvpTitle')}</Typography>
              <Typography sx={{ color: '#711c2e', textAlign: 'center', mb: 3, fontSize: '1rem' }}>{t('home.step2.rsvpDeadline')}</Typography>
              <Typography sx={{ color: '#5a3b45', textAlign: 'center', mb: 4 }}>{t('home.step2.rsvpQuestion')}</Typography>
              {guestList.map((guest, index) => (
                <Box key={index} sx={{ border: '1px dashed #711c2e', borderRadius: 2, p: { xs: 2, md: 3 }, mb: 3 }}>
                  <Typography sx={{ color: '#711c2e', fontWeight: 600, fontSize: '1.1rem', mb: 3 }}>{guest.nombre} {guest.tipo === 'niño' && <Chip label={t('home.step2.childBadge')} size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />}</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: guest.asistencia === 'si' ? 3 : 0 }}>
                    <FormControl fullWidth sx={{ width: '100%' }}><InputLabel>{t('home.step2.willAttendLabel')}</InputLabel><Select fullWidth value={guest.asistencia} label={t('home.step2.willAttendLabel')} onChange={(e) => handleGuestChange(index, 'asistencia', e.target.value)}><MenuItem value="si">{t('home.step2.willAttendYes')}</MenuItem><MenuItem value="no">{t('home.step2.willAttendNo')}</MenuItem></Select></FormControl>
                    {guest.asistencia === 'si' && (<FormControl fullWidth sx={{ width: '100%' }}><InputLabel>{t('home.step2.dietLabel')}</InputLabel><Select fullWidth value={guest.dieta} label={t('home.step2.dietLabel')} onChange={(e) => handleGuestChange(index, 'dieta', e.target.value)}><MenuItem value="None">{t('home.step2.dietNone')}</MenuItem><MenuItem value="Gluten free">{t('home.step2.dietGluten')}</MenuItem><MenuItem value="Vegetarian">{t('home.step2.dietVegetarian')}</MenuItem><MenuItem value="Vegan">{t('home.step2.dietVegan')}</MenuItem></Select></FormControl>)}
                  </Box>
                  {guest.asistencia === 'si' && (
                    <Box>
                      {guest.tipo === 'niño' ? (
                        <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 1, border: '1px dashed #ccc', textAlign: 'center' }}><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666' }}>{t('home.step2.kidsMenuText')}</Typography></Box>
                      ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          <FormControl fullWidth sx={{ width: '100%' }}><InputLabel>{t('home.step2.starterLabel')}</InputLabel><Select fullWidth value={guest.starter || ''} label={t('home.step2.starterLabel')} onChange={(e) => handleGuestChange(index, 'starter', e.target.value)}><MenuItem value="Caesar Salad">{t('home.step2.starter1')}</MenuItem><MenuItem value="Tomato Soup">{t('home.step2.starter2')}</MenuItem></Select></FormControl>
                          <FormControl fullWidth sx={{ width: '100%' }}><InputLabel>{t('home.step2.entreeLabel')}</InputLabel><Select fullWidth value={guest.entree || ''} label={t('home.step2.entreeLabel')} onChange={(e) => handleGuestChange(index, 'entree', e.target.value)}><MenuItem value="Grilled Chicken Breast">{t('home.step2.entree1')}</MenuItem><MenuItem value="Three Cheese Tortellini">{t('home.step2.entree2')}</MenuItem></Select></FormControl>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
              <Button fullWidth variant="contained" size="large" onClick={submitRSVP} disabled={loading} sx={{ mt: 2, py: 1.5, bgcolor: '#711c2e', color: 'white', '&:hover': { bgcolor: '#5a1524' } }}>{loading ? <CircularProgress size={24} color="inherit" /> : t('home.step2.continueButton')}</Button>
            </Card>
            <Card sx={cardStyle}>
              <Typography variant="h2" color="secondary" sx={{ textAlign: 'center', mb: 3, fontSize: { xs: '3rem', md: '4.5rem' } }}>{t('home.step2.lodgingTitle')}</Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ color: '#666', mb: 2, lineHeight: 1.6 }}>{t('home.step2.lodgingText1')} <strong>Prince of Wales Hotel</strong> {t('home.step2.lodgingText2')}</Typography>
                  <Typography variant="body1" sx={{ color: '#666', mb: 3, lineHeight: 1.6 }}>{t('home.step2.lodgingText3')} <strong style={{color: '#711c2e'}}>4088251</strong></Typography>
                  <Divider sx={{ my: 2, borderColor: '#eee' }} />
                  <Typography variant="body2" sx={{ mb: 4, color: '#999', lineHeight: 1.5 }}>{t('home.step2.lodgingNote')}</Typography>
                  <Button variant="outlined" href="https://www.vintage-hotels.com/prince-of-wales/" target="_blank" sx={{ color: '#711c2e', borderColor: '#711c2e', borderRadius: '30px', padding: '10px 24px', '&:hover': { borderColor: '#5a1524', backgroundColor: 'rgba(113, 28, 46, 0.04)' } }}>{t('home.step2.lodgingButton')}</Button>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}><img src="/POW-Traditional-Room.webp" alt="Habitación Prince of Wales" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', objectFit: 'cover' }} /></Box>
              </Box>
            </Card>
            <Card sx={cardStyle}><Typography variant="h2" color="secondary" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, mb: 0, textAlign: 'center' }}>{t('home.step2.closingText')}</Typography></Card>
          </Box>
        )}
      </Container>
      <Dialog open={alertModal.open} onClose={() => setAlertModal({ ...alertModal, open: false })} PaperProps={{ sx: { borderRadius: 2, border: '2px solid #dabc60', minWidth: '300px' } }}>
        <DialogTitle sx={{ bgcolor: '#711c2e', color: 'white', fontFamily: "'Playfair Display', serif", textAlign: 'center', fontSize: '1.5rem' }}>{t('common.warning')}</DialogTitle>
        <DialogContent sx={{ p: 4, textAlign: 'center', mt: 2 }}><Typography variant="body1" sx={{ color: '#5a3b45', fontWeight: 500 }}>{alertModal.message}</Typography></DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}><Button onClick={() => setAlertModal({ ...alertModal, open: false })} variant="contained" sx={{ bgcolor: '#711c2e', '&:hover': { bgcolor: '#5a1524' } }}>{t('common.understood')}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;