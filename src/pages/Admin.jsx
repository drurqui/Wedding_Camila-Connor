import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip, Tab, Tabs, 
  CircularProgress, IconButton, Divider, Grid, TextField, Button, 
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, 
  FormControl, InputLabel, Select, ToggleButtonGroup, ToggleButton, Tooltip 
} from '@mui/material';
import { collection, getDocs, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CelebrationIcon from '@mui/icons-material/Celebration';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useTranslation } from 'react-i18next';
import { getAuth, signOut } from 'firebase/auth';

const Admin = () => {
  const { t, i18n } = useTranslation();

  // Selector de Evento Principal: 'engagement' o 'wedding'
  const [eventMode, setEventMode] = useState('engagement');

  // Estado de pestañas dentro de Compromiso (0 a 3, exactamente como el original)
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Datos de Compromiso (Engagement)
  const [rsvps, setRsvps] = useState([]);
  const [listaMaestra, setListaMaestra] = useState([]);
  const [stats, setStats] = useState({ adultos: 0, ninos: 0, confirmados: 0, totalInvitados: 0 });
  const [nuevaInvitacion, setNuevaInvitacion] = useState({ nombre_invitacion: '', invitados: [{ nombre: '', tipo: 'adulto' }] });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rsvpEditDialogOpen, setRsvpEditDialogOpen] = useState(false);
  const [editRsvpData, setEditRsvpData] = useState(null);

  // Datos de Boda (Wedding)
  const [rsvpsBoda, setRsvpsBoda] = useState([]);
  const [statsBoda, setStatsBoda] = useState({ totalConfirmados: 0, totalInvitados: 0, shuttle: 0 });

  // Modales Visuales Globales
  const [alertModal, setAlertModal] = useState({ open: false, title: t('common.warning'), message: '' });
  const [confirmModal, setConfirmModal] = useState({ open: false, title: t('common.confirm'), message: '', action: null });

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const toggleLanguage = () => {
    const currentLang = i18n.language.substring(0, 2);
    let nextLang = 'es';
    if (currentLang === 'es') nextLang = 'en';
    else if (currentLang === 'en') nextLang = 'fr';
    else if (currentLang === 'fr') nextLang = 'es';
    i18n.changeLanguage(nextLang);
  };

  const fetchData = async () => {
    setLoading(true);
    let dataRsvp = [];
    let dataMaster = [];

    // 1. Cargar datos originales de Compromiso
    try {
      const snapRsvp = await getDocs(collection(db, "rsvps_compromiso"));
      dataRsvp = snapRsvp.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => {
        const dateA = a.fecha?.toMillis ? a.fecha.toMillis() : 0;
        const dateB = b.fecha?.toMillis ? b.fecha.toMillis() : 0;
        return dateB - dateA;
      });
      setRsvps(dataRsvp);
    } catch (error) {
      console.error("Error al cargar RSVPs Compromiso:", error);
    }

    try {
      const snapMaster = await getDocs(collection(db, "invitaciones"));
      dataMaster = snapMaster.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => {
        const nameA = a.nombre_invitacion || "";
        const nameB = b.nombre_invitacion || "";
        return nameA.localeCompare(nameB);
      });
      setListaMaestra(dataMaster);
    } catch (error) {
      console.error("Error al cargar Lista Maestra:", error);
    }

    try {
      let countConfirmados = 0;
      let countAdultos = 0;
      let countNinos = 0;
      let countTotalInvitados = 0;
      dataRsvp.forEach(rsvp => {
        rsvp.invitados?.forEach(inv => {
          if (inv.asistencia === 'si') {
            countConfirmados++;
            if (inv.tipo === 'niño') {
              countNinos++;
            } else {
              countAdultos++;
            }
          }
        });
      });
      dataMaster.forEach(m => {
        countTotalInvitados += (m.invitados?.length || 0);
      });
      setStats({
        confirmados: countConfirmados,
        adultos: countAdultos,
        ninos: countNinos,
        totalInvitados: countTotalInvitados
      });
    } catch (error) {
      console.error("Error calculando estadísticas de Compromiso:", error);
    }

    // 2. Cargar datos de la Boda (rsvps_boda) de forma separada
    try {
      const weddingSnap = await getDocs(collection(db, "rsvps_boda"));
      const weddingList = weddingSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
        const timeA = a.creado_el?.toMillis ? a.creado_el.toMillis() : (a.fecha?.toMillis ? a.fecha.toMillis() : 0);
        const timeB = b.creado_el?.toMillis ? b.creado_el.toMillis() : (b.fecha?.toMillis ? b.fecha.toMillis() : 0);
        return timeB - timeA;
      });
      setRsvpsBoda(weddingList);

      let wConf = 0;
      let wTotal = 0;
      let wShuttle = 0;
      weddingList.forEach(item => {
        if (item.asistencia === 'si') {
          wConf += 1;
          const count = Number(item.total_invitados || item.num_invitados) || 1;
          wTotal += count;
          if (item.shuttle === 'si' || item.transporte_shuttle === 'si') {
            wShuttle += count;
          }
        }
      });
      setStatsBoda({ totalConfirmados: wConf, totalInvitados: wTotal, shuttle: wShuttle });
    } catch (err) {
      console.error("Error al cargar RSVPs Boda:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers Originales de Compromiso (sin tocar) ---
  const eliminarRsvp = (id) => {
    setConfirmModal({
      open: true,
      title: t('admin.alerts.deleteRsvpTitle'),
      message: t('admin.alerts.deleteRsvpMsg'),
      action: async () => {
        setConfirmModal({ ...confirmModal, open: false });
        setLoading(true);
        try {
          await deleteDoc(doc(db, "rsvps_compromiso", id));
          fetchData();
        } catch (error) {
          setAlertModal({ open: true, title: t('common.error'), message: t('admin.alerts.deleteRsvpError') + error.message });
          setLoading(false);
        }
      }
    });
  };

  const abrirModalEdicionRsvp = (rsvp) => {
    setEditRsvpData(JSON.parse(JSON.stringify(rsvp)));
    setRsvpEditDialogOpen(true);
  };

  const handleRsvpGuestChange = (index, field, value) => {
    const list = [...editRsvpData.invitados];
    list[index][field] = value;
    if (field === 'tipo' && value === 'niño') {
      list[index]['starter'] = 'Menú Infantil';
      list[index]['entree'] = 'Menú Infantil';
    }
    setEditRsvpData({ ...editRsvpData, invitados: list });
  };

  const guardarEdicionRsvp = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "rsvps_compromiso", editRsvpData.id);
      await updateDoc(docRef, {
        nombre: editRsvpData.nombre,
        email: editRsvpData.email,
        invitados: editRsvpData.invitados
      });
      setRsvpEditDialogOpen(false);
      fetchData();
    } catch (error) {
      setAlertModal({ open: true, title: t('common.error'), message: t('admin.alerts.updateRsvpError') + error.message });
      setLoading(false);
    }
  };

  const handleAddGuestField = () => {
    setNuevaInvitacion({
      ...nuevaInvitacion,
      invitados: [...nuevaInvitacion.invitados, { nombre: '', tipo: 'adulto' }]
    });
  };

  const handleRemoveGuestField = (index) => {
    const list = [...nuevaInvitacion.invitados];
    list.splice(index, 1);
    setNuevaInvitacion({ ...nuevaInvitacion, invitados: list });
  };

  const handleGuestChange = (index, field, value) => {
    const list = [...nuevaInvitacion.invitados];
    list[index][field] = value;
    setNuevaInvitacion({ ...nuevaInvitacion, invitados: list });
  };

  const guardarNuevaInvitacion = async () => {
    if (!nuevaInvitacion.nombre_invitacion.trim()) {
      setAlertModal({ open: true, title: t('common.warning'), message: t('admin.alerts.assignName') });
      return;
    }
    if (nuevaInvitacion.invitados.some(i => i.nombre.trim() === "")) {
      setAlertModal({ open: true, title: t('common.warning'), message: t('admin.alerts.allNeedNames') });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "invitaciones"), {
        nombre_invitacion: nuevaInvitacion.nombre_invitacion,
        invitados: nuevaInvitacion.invitados,
        email_vinculado: "",
        creado_el: serverTimestamp()
      });
      setAlertModal({ open: true, title: t('common.success'), message: t('admin.alerts.saveSuccess') });
      setNuevaInvitacion({ nombre_invitacion: '', invitados: [{ nombre: '', tipo: 'adulto' }] });
      fetchData();
    } catch (e) {
      setAlertModal({ open: true, title: t('common.error'), message: t('admin.alerts.errorPrefix') + e.message });
    }
    setLoading(false);
  };

  const eliminarInvitacion = (id) => {
    setConfirmModal({
      open: true,
      title: t('admin.alerts.deleteInvTitle'),
      message: t('admin.alerts.deleteInvMsg'),
      action: async () => {
        setConfirmModal({ ...confirmModal, open: false });
        setLoading(true);
        try {
          await deleteDoc(doc(db, "invitaciones", id));
          fetchData();
        } catch (error) {
          setAlertModal({ open: true, title: t('common.error'), message: t('admin.alerts.deleteError') });
          setLoading(false);
        }
      }
    });
  };

  const abrirModalEdicion = (invitacion) => {
    setEditData(JSON.parse(JSON.stringify(invitacion)));
    setEditDialogOpen(true);
  };

  const guardarEdicion = async () => {
    if (!editData.nombre_invitacion.trim()) {
      setAlertModal({ open: true, title: t('common.warning'), message: t('admin.alerts.emptyName') });
      return;
    }
    if (editData.invitados.some(i => i.nombre.trim() === "")) {
      setAlertModal({ open: true, title: t('common.warning'), message: t('admin.alerts.allNeedNames') });
      return;
    }
    setLoading(true);
    try {
      const docRef = doc(db, "invitaciones", editData.id);
      await updateDoc(docRef, {
        nombre_invitacion: editData.nombre_invitacion,
        invitados: editData.invitados
      });
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      setAlertModal({ open: true, title: t('common.error'), message: t('admin.alerts.saveChangesError') });
      setLoading(false);
    }
  };

  // --- Handlers de Boda (Separados) ---
  const eliminarRsvpBoda = (id) => {
    setConfirmModal({
      open: true,
      title: "Eliminar Registro de Boda",
      message: "¿Estás seguro de que deseas eliminar permanentemente este registro de la Boda?",
      action: async () => {
        setConfirmModal({ ...confirmModal, open: false });
        setLoading(true);
        try {
          await deleteDoc(doc(db, "rsvps_boda", id));
          fetchData();
        } catch (error) {
          setAlertModal({ open: true, title: t('common.error'), message: error.message });
          setLoading(false);
        }
      }
    });
  };

  // Estilos de cabecera de tabla
  const headerStyleEngagement = {
    bgcolor: '#711c2e',
    color: '#ffffff',
    fontWeight: 'bold',
    fontFamily: "'Montserrat', sans-serif",
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '1px'
  };

  const headerStyleWedding = {
    bgcolor: '#1e382b',
    color: '#ffffff',
    fontWeight: 'bold',
    fontFamily: "'Montserrat', sans-serif",
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '1px'
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fdfbf7', pb: 10 }}>
      {/* Botón flotante de idioma */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={toggleLanguage} 
          sx={{ borderRadius: '20px', minWidth: 'auto', fontWeight: 'bold' }}
        >
          {i18n.language.startsWith('es') ? 'EN' : i18n.language.startsWith('en') ? 'FR' : 'ES'}
        </Button>
      </Box>

      {/* BARRA SUPERIOR: SELECTOR DE EVENTO INDEPENDIENTE */}
      <Box 
        sx={{ 
          bgcolor: eventMode === 'engagement' ? '#541421' : '#14261d', 
          py: 1.5, 
          px: 3, 
          borderBottom: `2px solid ${eventMode === 'engagement' ? '#dabc60' : '#c7784f'}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'background-color 0.3s ease'
        }}
      >
        <ToggleButtonGroup
          value={eventMode}
          exclusive
          onChange={(e, newMode) => {
            if (newMode) setEventMode(newMode);
          }}
          size="small"
          sx={{
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: '25px',
            p: 0.5,
            '& .MuiToggleButton-root': {
              color: 'rgba(255,255,255,0.75)',
              borderRadius: '20px !important',
              border: 'none',
              px: { xs: 2, sm: 3 },
              py: 0.8,
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: { xs: '0.82rem', sm: '0.92rem' },
              '&.Mui-selected': {
                bgcolor: eventMode === 'engagement' ? '#dabc60' : '#c7784f',
                color: eventMode === 'engagement' ? '#711c2e' : '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                '&:hover': {
                  bgcolor: eventMode === 'engagement' ? '#e2c875' : '#d98d68',
                }
              }
            }
          }}
        >
          <ToggleButton value="engagement">
            <CelebrationIcon sx={{ fontSize: 18, mr: 1 }} />
            Fiesta de Compromiso (Engagement)
          </ToggleButton>
          <ToggleButton value="wedding">
            <FavoriteIcon sx={{ fontSize: 18, mr: 1 }} />
            Boda (Wedding)
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ========================================================================= */}
      {/* VISTA 1: FIESTA DE COMPROMISO (PANEL ORIGINAL 100% IDÉNTICO E INTACTO)      */}
      {/* ========================================================================= */}
      {eventMode === 'engagement' && (
        <>
          <Box sx={{ bgcolor: '#ffffff', borderBottom: '2px solid #711c2e', p: 4, mb: 5, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Container maxWidth="lg">
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>
                  <Typography variant="h3" sx={{ fontFamily: "'Playfair Display', serif", color: '#711c2e', mb: 1 }}>
                    {t('admin.header.title')}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#dabc60', fontWeight: 500, letterSpacing: '1px' }}>
                    {t('admin.header.subtitle')}
                  </Typography>
                </Grid>
                <Grid item sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<ExitToAppIcon />} 
                    onClick={handleLogout} 
                    sx={{ color: '#711c2e', borderColor: '#711c2e', fontWeight: 'bold', '&:hover': { bgcolor: '#fdfbf7', borderColor: '#5a1524' } }}
                  >
                    {t('admin.header.logout')}
                  </Button>
                  <IconButton 
                    onClick={fetchData} 
                    sx={{ bgcolor: '#711c2e', color: 'white', '&:hover': { bgcolor: '#5a1524' }, width: 50, height: 50 }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Container>
          </Box>

          <Container maxWidth="lg">
            {/* Las 4 Tarjetas de Estadísticas Originales de Compromiso */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
              <Grid item xs={12} sm={3}>
                <Card sx={{ p: 3, textAlign: 'center', border: '1px solid #e0e0e0' }}>
                  <Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold' }}>
                    {t('admin.stats.guests')}
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#711c2e', fontWeight: 'bold', mt: 1 }}>
                    {stats.totalInvitados}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ p: 3, textAlign: 'center', border: '1px solid #711c2e', bgcolor: '#fffcf5' }}>
                  <Typography variant="caption" sx={{ color: '#711c2e', fontWeight: 'bold' }}>
                    {t('admin.stats.confirmed')}
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#711c2e', fontWeight: 'bold', mt: 1 }}>
                    {stats.confirmados}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ p: 3, textAlign: 'center', border: '1px solid #e0e0e0' }}>
                  <Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold' }}>
                    {t('admin.stats.adults')}
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#dabc60', fontWeight: 'bold', mt: 1 }}>
                    {stats.adultos}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ p: 3, textAlign: 'center', border: '1px solid #e0e0e0' }}>
                  <Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold' }}>
                    {t('admin.stats.kids')}
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#711c2e', fontWeight: 'bold', mt: 1 }}>
                    {stats.ninos}
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Pestañas Originales de Compromiso (0 a 3) */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #711c2e', boxShadow: 'none' }}>
              <Tabs 
                value={tabValue} 
                onChange={(e, v) => setTabValue(v)} 
                variant="fullWidth" 
                indicatorColor="primary" 
                textColor="primary" 
                sx={{ bgcolor: '#f8f8f8', borderBottom: '1px solid #eee' }}
              >
                <Tab label={t('admin.tabs.rsvps')} sx={{ fontWeight: 'bold' }} />
                <Tab label={t('admin.tabs.masterList')} sx={{ fontWeight: 'bold' }} />
                <Tab label={t('admin.tabs.kitchen')} sx={{ fontWeight: 'bold' }} />
                <Tab label={t('admin.tabs.addInv')} sx={{ fontWeight: 'bold' }} />
              </Tabs>

              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 10 }}>
                  <CircularProgress size={60} sx={{ color: '#711c2e', mb: 2 }} />
                  <Typography sx={{ color: '#711c2e', fontWeight: 500 }}>{t('admin.loading')}</Typography>
                </Box>
              ) : (
                <Box sx={{ p: 4 }}>
                  {/* TAB 0: Confirmaciones Compromiso */}
                  {tabValue === 0 && (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={headerStyleEngagement}>{t('admin.table.family')}</TableCell>
                            <TableCell sx={headerStyleEngagement}>{t('admin.table.attendance')}</TableCell>
                            <TableCell sx={headerStyleEngagement}>{t('admin.table.details')}</TableCell>
                            <TableCell sx={headerStyleEngagement} align="center">{t('admin.table.actions')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rsvps.length > 0 ? rsvps.map((row) => (
                            <TableRow key={row.id} hover>
                              <TableCell sx={{ fontWeight: 'bold', verticalAlign: 'top' }}>
                                {row.nombre || t('admin.table.noName')}
                                <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>{row.email}</Typography>
                              </TableCell>
                              <TableCell sx={{ verticalAlign: 'top' }}>
                                <Chip 
                                  label={row.asistencia === 'si' ? t('admin.table.willAttend') : t('admin.table.wontAttend')} 
                                  color={row.asistencia === 'si' ? "success" : "error"} 
                                  variant="outlined" 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell>
                                {row.invitados && Array.isArray(row.invitados) ? row.invitados.map((inv, i) => (
                                  <Box key={i} sx={{ mb: 2, p: 2, bgcolor: '#fafafa', borderRadius: 1, border: '1px solid #eee' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#711c2e' }}>
                                      {inv.nombre} {inv.tipo === 'niño' && t('admin.table.child')}
                                    </Typography>
                                    {inv.asistencia === 'si' ? (
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" display="block"><strong>{t('admin.table.starter')}</strong> {inv.starter || t('admin.table.notSelected')}</Typography>
                                        <Typography variant="caption" display="block"><strong>{t('admin.table.entree')}</strong> {inv.entree || t('admin.table.notSelected')}</Typography>
                                        {inv.dieta && inv.dieta !== 'None' && (
                                          <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold', mt: 0.5 }} display="block">
                                            {t('admin.table.allergy')}{inv.dieta}
                                          </Typography>
                                        )}
                                      </Box>
                                    ) : (
                                      <Typography variant="caption" sx={{ color: '#bbb', fontStyle: 'italic' }}>{t('admin.table.declined')}</Typography>
                                    )}
                                  </Box>
                                )) : (<Typography variant="caption" sx={{ color: '#bbb' }}>{t('admin.table.noGuests')}</Typography>)}
                              </TableCell>
                              <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                                <IconButton onClick={() => abrirModalEdicionRsvp(row)} size="small" sx={{ color: '#dabc60', mr: 1 }}>
                                  <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => eliminarRsvp(row.id)} size="small" color="error">
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#888' }}>
                                {t('admin.table.noConfirmations')}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {/* TAB 1: Lista Maestra */}
                  {tabValue === 1 && (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={headerStyleEngagement}>{t('admin.table.invName')}</TableCell>
                            <TableCell sx={headerStyleEngagement}>{t('admin.table.groupMembers')}</TableCell>
                            <TableCell sx={headerStyleEngagement}>{t('admin.table.guestAccess')}</TableCell>
                            <TableCell sx={headerStyleEngagement} align="center">{t('admin.table.actions')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {listaMaestra.length > 0 ? listaMaestra.map((row) => (
                            <TableRow key={row.id} hover>
                              <TableCell sx={{ fontWeight: 'bold' }}>{row.nombre_invitacion || t('admin.table.untitled')}</TableCell>
                              <TableCell>
                                {row.invitados && Array.isArray(row.invitados) ? row.invitados.map((inv, i) => (
                                  <Chip key={i} label={inv.nombre || t('admin.table.anonymous')} size="small" variant="outlined" sx={{ mr: 1, mb: 1, borderColor: inv.tipo === 'niño' ? '#dabc60' : '#ccc' }} />
                                )) : (<Typography variant="caption" color="textSecondary">{t('admin.table.noMemberData')}</Typography>)}
                              </TableCell>
                              <TableCell>
                                {row.email_vinculado ? (<Chip label={row.email_vinculado} size="small" color="primary" />) : (<Typography variant="caption" sx={{ color: '#bbb' }}>{t('admin.table.pendingLogin')}</Typography>)}
                              </TableCell>
                              <TableCell align="center">
                                <IconButton onClick={() => abrirModalEdicion(row)} size="small" sx={{ color: '#dabc60', mr: 1 }}><EditIcon /></IconButton>
                                <IconButton onClick={() => eliminarInvitacion(row.id)} size="small" color="error"><DeleteIcon /></IconButton>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#888' }}>{t('admin.table.emptyMaster')}</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {/* TAB 2: Reporte de Cocina */}
                  {tabValue === 2 && (
                    <Grid container spacing={4}>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ p: 3, height: '100%', borderTop: '4px solid #711c2e', display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#711c2e', mb: 2 }}>{t('admin.kitchen.starters')}</Typography>
                          <Box sx={{ flexGrow: 1 }}>
                            {Object.entries(rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si').reduce((acc, i) => { const plato = i.starter || t('admin.kitchen.notChosen'); acc[plato] = (acc[plato] || 0) + 1; return acc; }, {})).map(([plato, total]) => (
                              <Box key={plato} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px dashed #ccc', mb: 1, gap: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, wordBreak: 'break-word' }}>{plato}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#711c2e', minWidth: '30px', textAlign: 'right' }}>{total}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card sx={{ p: 3, height: '100%', borderTop: '4px solid #711c2e', display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#711c2e', mb: 2 }}>{t('admin.kitchen.entrees')}</Typography>
                          <Box sx={{ flexGrow: 1 }}>
                            {Object.entries(rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si').reduce((acc, i) => { const plato = i.entree || t('admin.kitchen.notChosen'); acc[plato] = (acc[plato] || 0) + 1; return acc; }, {})).map(([plato, total]) => (
                              <Box key={plato} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px dashed #ccc', mb: 1, gap: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, wordBreak: 'break-word' }}>{plato}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#711c2e', minWidth: '30px', textAlign: 'right' }}>{total}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card sx={{ p: 3, height: '100%', borderTop: '4px solid #dabc60', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#dabc60', mb: 1, textAlign: 'center', width: '100%' }}>{t('admin.kitchen.kidsMenu')}</Typography>
                          <Typography variant="h4" sx={{ color: '#711c2e', fontWeight: 'bold', my: 2, display: 'inline-flex', alignItems: 'center' }}>
                            {rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si' && i.tipo === 'niño').length}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#888', textAlign: 'center' }}>{t('admin.kitchen.kidsTotal')}</Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card sx={{ p: 3, height: '100%', borderTop: '4px solid #d32f2f', display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#d32f2f', mb: 2 }}>{t('admin.kitchen.allergies')}</Typography>
                          <Box sx={{ flexGrow: 1, maxHeight: 300, overflow: 'auto' }}>
                            {rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si' && i.dieta && i.dieta !== 'None').map((inv, idx) => (
                              <Box key={idx} sx={{ p: 1.5, mb: 1.5, borderLeft: '3px solid #d32f2f', bgcolor: '#fff5f5', borderRadius: '0 4px 4px 0' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{inv.nombre}</Typography>
                                <Typography variant="caption" sx={{ color: '#d32f2f', display: 'block', mt: 0.5 }}>{inv.dieta}</Typography>
                              </Box>
                            ))}
                            {rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si' && i.dieta && i.dieta !== 'None').length === 0 && (
                              <Typography variant="body2" sx={{ color: '#888', fontStyle: 'italic' }}>{t('admin.kitchen.noAllergies')}</Typography>
                            )}
                          </Box>
                        </Card>
                      </Grid>
                    </Grid>
                  )}

                  {/* TAB 3: Añadir Invitación */}
                  {tabValue === 3 && (
                    <Box sx={{ maxWidth: 700, mx: 'auto', py: 2 }}>
                      <Typography variant="h5" sx={{ fontFamily: "'Playfair Display', serif", color: '#711c2e', mb: 4, textAlign: 'center' }}>{t('admin.addInv.title')}</Typography>
                      <Card sx={{ p: 4, border: '1px solid #dabc60', boxShadow: '0 4px 15px rgba(218, 188, 96, 0.1)' }}>
                        <TextField fullWidth label={t('admin.addInv.invTitle')} placeholder={t('admin.addInv.placeholder')} variant="outlined" value={nuevaInvitacion.nombre_invitacion} onChange={(e) => setNuevaInvitacion({...nuevaInvitacion, nombre_invitacion: e.target.value})} sx={{ mb: 4 }} />
                        <Typography variant="subtitle2" sx={{ mb: 2, color: '#711c2e', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>{t('admin.addInv.membersLabel')}</Typography>
                        {nuevaInvitacion.invitados.map((guest, index) => (
                          <Grid container spacing={2} key={index} sx={{ mb: 3 }} alignItems="center">
                            <Grid item xs={7}><TextField fullWidth label={t('admin.addInv.fullName')} variant="outlined" size="small" value={guest.nombre} onChange={(e) => handleGuestChange(index, 'nombre', e.target.value)} /></Grid>
                            <Grid item xs={3}><TextField select fullWidth size="small" label={t('admin.addInv.category')} value={guest.tipo} onChange={(e) => handleGuestChange(index, 'tipo', e.target.value)}><MenuItem value="adulto">{t('admin.addInv.adult')}</MenuItem><MenuItem value="niño">{t('admin.addInv.kid')}</MenuItem></TextField></Grid>
                            <Grid item xs={2} sx={{ textAlign: 'center' }}><IconButton onClick={() => handleRemoveGuestField(index)} disabled={nuevaInvitacion.invitados.length === 1} color="error"><DeleteIcon /></IconButton></Grid>
                          </Grid>
                        ))}
                        <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddGuestField} sx={{ mb: 4, color: '#711c2e', fontWeight: 'bold' }}>{t('admin.addInv.addMemberButton')}</Button>
                        <Divider sx={{ mb: 4 }} />
                        <Button fullWidth variant="contained" size="large" onClick={guardarNuevaInvitacion} sx={{ bgcolor: '#711c2e', color: 'white', py: 2, fontWeight: 'bold', '&:hover': { bgcolor: '#5a1524' } }}>{t('admin.addInv.saveInvButton')}</Button>
                      </Card>
                    </Box>
                  )}

                </Box>
              )}
            </Paper>
          </Container>
        </>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: BODA (PANEL DEDICADO INDEPENDIENTE PARA LA BODA EN FORÊT)         */}
      {/* ========================================================================= */}
      {eventMode === 'wedding' && (
        <>
          <Box sx={{ bgcolor: '#ffffff', borderBottom: '2px solid #1e382b', p: 4, mb: 5, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Container maxWidth="lg">
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>
                  <Typography variant="h3" sx={{ fontFamily: "'Playfair Display', serif", color: '#1e382b', mb: 1 }}>
                    Administración de la Boda
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#c7784f', fontWeight: 600, letterSpacing: '1px' }}>
                    FORÊT • COMASAGUA • CONTROL EXCLUSIVO DE BODA
                  </Typography>
                </Grid>
                <Grid item sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<ExitToAppIcon />} 
                    onClick={handleLogout} 
                    sx={{ color: '#1e382b', borderColor: '#1e382b', fontWeight: 'bold', '&:hover': { bgcolor: '#fdfbf7', borderColor: '#15271e' } }}
                  >
                    {t('admin.header.logout')}
                  </Button>
                  <IconButton 
                    onClick={fetchData} 
                    sx={{ bgcolor: '#1e382b', color: 'white', '&:hover': { bgcolor: '#15271e' }, width: 50, height: 50 }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Container>
          </Box>

          <Container maxWidth="lg">
            {/* Tarjetas de Estadísticas de la Boda */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 3, textAlign: 'center', border: '1px solid #1e382b', bgcolor: '#fbfcfb' }}>
                  <Typography variant="caption" sx={{ color: '#1e382b', fontWeight: 'bold' }}>
                    CONFIRMACIONES RECIBIDAS
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#1e382b', fontWeight: 'bold', mt: 1 }}>
                    {statsBoda.totalConfirmados}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 3, textAlign: 'center', border: '1px solid #c7784f', bgcolor: '#fffcfb' }}>
                  <Typography variant="caption" sx={{ color: '#c7784f', fontWeight: 'bold' }}>
                    TOTAL DE ASISTENTES CONFIRMADOS
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#c7784f', fontWeight: 'bold', mt: 1 }}>
                    {statsBoda.totalInvitados}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 3, textAlign: 'center', border: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>
                    PASAJEROS EN SHUTTLE BUS
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#1e382b', fontWeight: 'bold', mt: 1, display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsBusIcon sx={{ color: '#c7784f' }} /> {statsBoda.shuttle}
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Tabla Completa de RSVPs de la Boda */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #1e382b', boxShadow: 'none' }}>
              <Box sx={{ p: 2.5, bgcolor: '#fbfcfb', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ color: '#1e382b', fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                  Listado Oficial de Respuestas • Boda
                </Typography>
                <Chip label={`${rsvpsBoda.length} registros`} size="small" sx={{ bgcolor: '#1e382b', color: '#fff', fontWeight: 600 }} />
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 10 }}>
                  <CircularProgress size={60} sx={{ color: '#1e382b', mb: 2 }} />
                  <Typography sx={{ color: '#1e382b', fontWeight: 500 }}>Cargando confirmaciones...</Typography>
                </Box>
              ) : (
                <Box sx={{ p: { xs: 2, md: 3 } }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={headerStyleWedding}>Invitado Principal</TableCell>
                          <TableCell sx={headerStyleWedding}>Asistencia</TableCell>
                          <TableCell sx={headerStyleWedding} align="center">Total Personas</TableCell>
                          <TableCell sx={headerStyleWedding}>Acompañantes</TableCell>
                          <TableCell sx={headerStyleWedding} align="center">Shuttle Bus</TableCell>
                          <TableCell sx={headerStyleWedding}>Alergias / Dieta</TableCell>
                          <TableCell sx={headerStyleWedding}>Mensaje</TableCell>
                          <TableCell sx={headerStyleWedding} align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rsvpsBoda.length > 0 ? (
                          rsvpsBoda.map((row) => (
                            <TableRow key={row.id} hover>
                              <TableCell sx={{ fontWeight: 'bold', verticalAlign: 'top' }}>
                                {row.nombre || t('admin.table.noName')}
                                <Typography variant="body2" sx={{ color: '#777', mt: 0.5, fontWeight: 'normal' }}>
                                  {row.email}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ verticalAlign: 'top' }}>
                                <Chip 
                                  label={row.asistencia === 'si' ? "Asistirá" : "No asistirá"} 
                                  color={row.asistencia === 'si' ? "success" : "error"} 
                                  variant="outlined" 
                                  size="small" 
                                  icon={row.asistencia === 'si' ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
                                />
                              </TableCell>
                              <TableCell align="center" sx={{ verticalAlign: 'top', fontWeight: 'bold', fontSize: '1rem', color: '#1e382b' }}>
                                {row.asistencia === 'si' ? (row.total_invitados || row.num_invitados || 1) : 0}
                              </TableCell>
                              <TableCell sx={{ verticalAlign: 'top', maxWidth: 220 }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                  {row.nombres_acompanantes ? row.nombres_acompanantes : <span style={{ color: '#aaa', fontStyle: 'italic' }}>Ninguno</span>}
                                </Typography>
                              </TableCell>
                              <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                                {(row.shuttle === 'si' || row.transporte_shuttle === 'si') ? (
                                  <Chip label="Sí" color="primary" size="small" icon={<DirectionsBusIcon />} />
                                ) : (
                                  <Chip label="No" size="small" variant="outlined" />
                                )}
                              </TableCell>
                              <TableCell sx={{ verticalAlign: 'top', maxWidth: 200 }}>
                                {row.dieta ? (
                                  <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600, display: 'block' }}>
                                    ⚠️ {row.dieta}
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" sx={{ color: '#888' }}>Ninguna</Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ verticalAlign: 'top', maxWidth: 220 }}>
                                {row.mensaje ? (
                                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#555' }}>
                                    "{row.mensaje}"
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" sx={{ color: '#aaa' }}>—</Typography>
                                )}
                              </TableCell>
                              <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                                <Tooltip title="Eliminar registro">
                                  <IconButton onClick={() => eliminarRsvpBoda(row.id)} size="small" color="error">
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#888' }}>
                              Aún no hay confirmaciones recibidas para la Boda.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>
          </Container>
        </>
      )}

      {/* DIÁLOGO EDICIÓN LISTA MAESTRA (COMPROMISO) */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth>
        <DialogTitle sx={{ bgcolor: '#711c2e', color: 'white' }}>{t('admin.editMaster.title')}</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {editData && (
            <Box>
              <TextField fullWidth label={t('admin.editMaster.titleLabel')} value={editData.nombre_invitacion} onChange={(e) => setEditData({...editData, nombre_invitacion: e.target.value})} sx={{ my: 2 }} />
              {editData.invitados.map((g, i) => (
                <Grid container spacing={1} key={i} sx={{ mb: 2 }}>
                  <Grid item xs={8}><TextField fullWidth label={t('admin.editMaster.nameLabel')} size="small" value={g.nombre} onChange={(e) => { const l = [...editData.invitados]; l[i].nombre = e.target.value; setEditData({...editData, invitados: l}); }} /></Grid>
                  <Grid item xs={4}><TextField select fullWidth label={t('admin.editMaster.typeLabel')} size="small" value={g.tipo} onChange={(e) => { const l = [...editData.invitados]; l[i].tipo = e.target.value; setEditData({...editData, invitados: l}); }}><MenuItem value="adulto">{t('admin.editMaster.adultLabel')}</MenuItem><MenuItem value="niño">{t('admin.editMaster.kidLabel')}</MenuItem></TextField></Grid>
                </Grid>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)}>{t('common.close')}</Button>
          <Button onClick={guardarEdicion} variant="contained" sx={{ bgcolor: '#711c2e' }}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO EDICIÓN RSVP (COMPROMISO) */}
      <Dialog open={rsvpEditDialogOpen} onClose={() => setRsvpEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#711c2e', color: 'white' }}>{t('admin.editRsvp.title')}</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {editRsvpData && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
                <Grid item xs={12} sm={6}><TextField fullWidth label={t('admin.editRsvp.sender')} value={editRsvpData.nombre} onChange={(e) => setEditRsvpData({...editRsvpData, nombre: e.target.value})} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label={t('admin.editRsvp.email')} value={editRsvpData.email} onChange={(e) => setEditRsvpData({...editRsvpData, email: e.target.value})} /></Grid>
              </Grid>
              <Typography variant="subtitle2" sx={{ color: '#711c2e', mb: 2, fontWeight: 'bold' }}>{t('admin.editRsvp.guestManagement')}</Typography>
              {editRsvpData.invitados.map((inv, idx) => (
                <Box key={idx} sx={{ p: 2, mb: 2, border: '1px solid #ddd', borderRadius: 2, bgcolor: '#fafafa' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}><TextField fullWidth label={t('admin.editMaster.nameLabel')} size="small" value={inv.nombre} onChange={(e) => handleRsvpGuestChange(idx, 'nombre', e.target.value)} /></Grid>
                    <Grid item xs={6} sm={4}><FormControl fullWidth size="small"><InputLabel>{t('admin.editMaster.typeLabel')}</InputLabel><Select value={inv.tipo} label={t('admin.editMaster.typeLabel')} onChange={(e) => handleRsvpGuestChange(idx, 'tipo', e.target.value)}><MenuItem value="adulto">{t('admin.editMaster.adultLabel')}</MenuItem><MenuItem value="niño">{t('admin.editMaster.kidLabel')}</MenuItem></Select></FormControl></Grid>
                    <Grid item xs={6} sm={4}><FormControl fullWidth size="small"><InputLabel>{t('admin.table.attendance')}</InputLabel><Select value={inv.asistencia} label={t('admin.table.attendance')} onChange={(e) => handleRsvpGuestChange(idx, 'asistencia', e.target.value)}><MenuItem value="si">{t('admin.editRsvp.confirmed')}</MenuItem><MenuItem value="no">{t('admin.editRsvp.declined')}</MenuItem></Select></FormControl></Grid>
                    {inv.asistencia === 'si' && (
                      inv.tipo === 'niño' ? (
                        <>
                          <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={t('admin.editRsvp.starter')} value="Menú Infantil" disabled sx={{ bgcolor: '#ebebeb' }} /></Grid>
                          <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={t('admin.editRsvp.entree')} value="Menú Infantil" disabled sx={{ bgcolor: '#ebebeb' }} /></Grid>
                          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>{t('admin.editRsvp.allergies')}</InputLabel><Select value={inv.dieta || 'None'} label={t('admin.editRsvp.allergies')} onChange={(e) => handleRsvpGuestChange(idx, 'dieta', e.target.value)}><MenuItem value="None">Ninguna</MenuItem><MenuItem value="Gluten free">Gluten free</MenuItem><MenuItem value="Vegetarian">Vegetariano</MenuItem><MenuItem value="Vegan">Vegano</MenuItem></Select></FormControl></Grid>
                        </>
                      ) : (
                        <>
                          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>{t('admin.editRsvp.starter')}</InputLabel><Select value={inv.starter || ''} label={t('admin.editRsvp.starter')} onChange={(e) => handleRsvpGuestChange(idx, 'starter', e.target.value)}><MenuItem value='Caesar Salad'>"Prince of Wales" Caesar Salad</MenuItem><MenuItem value='Tomato Soup'>Tomato Soup</MenuItem></Select></FormControl></Grid>
                          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>{t('admin.editRsvp.entree')}</InputLabel><Select value={inv.entree || ''} label={t('admin.editRsvp.entree')} onChange={(e) => handleRsvpGuestChange(idx, 'entree', e.target.value)}><MenuItem value='Grilled Chicken Breast'>Grilled Chicken Breast</MenuItem><MenuItem value='Three Cheese Tortellini'>Three Cheese Tortellini</MenuItem></Select></FormControl></Grid>
                          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>{t('admin.editRsvp.allergies')}</InputLabel><Select value={inv.dieta || 'None'} label={t('admin.editRsvp.allergies')} onChange={(e) => handleRsvpGuestChange(idx, 'dieta', e.target.value)}><MenuItem value="None">Ninguna</MenuItem><MenuItem value="Gluten free">Gluten free</MenuItem><MenuItem value="Vegetarian">Vegetariano</MenuItem><MenuItem value="Vegan">Vegano</MenuItem></Select></FormControl></Grid>
                        </>
                      )
                    )}
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setRsvpEditDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={guardarEdicionRsvp} variant="contained" sx={{ bgcolor: '#711c2e' }}>{t('admin.editRsvp.saveButton')}</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL GLOBAL PARA AVISOS ADMIN */}
      <Dialog open={alertModal.open} onClose={() => setAlertModal({ ...alertModal, open: false })} PaperProps={{ sx: { borderRadius: 2, border: '2px solid #dabc60', minWidth: '300px' } }}>
        <DialogTitle sx={{ bgcolor: '#711c2e', color: 'white', fontFamily: "'Playfair Display', serif", textAlign: 'center', fontSize: '1.5rem' }}>{alertModal.title}</DialogTitle>
        <DialogContent sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#5a3b45', fontWeight: 500 }}>{alertModal.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setAlertModal({ ...alertModal, open: false })} variant="contained" sx={{ bgcolor: '#711c2e', '&:hover': { bgcolor: '#5a1524' } }}>{t('common.understood')}</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO ADMIN */}
      <Dialog open={confirmModal.open} onClose={() => setConfirmModal({ ...confirmModal, open: false })} PaperProps={{ sx: { borderRadius: 2, border: '2px solid #dabc60', minWidth: '350px' } }}>
        <DialogTitle sx={{ bgcolor: '#711c2e', color: 'white', fontFamily: "'Playfair Display', serif", textAlign: 'center', fontSize: '1.5rem' }}>{confirmModal.title}</DialogTitle>
        <DialogContent sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#5a3b45', fontWeight: 500 }}>{confirmModal.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <Button onClick={() => setConfirmModal({ ...confirmModal, open: false })} variant="outlined" sx={{ color: '#711c2e', borderColor: '#711c2e' }}>{t('common.cancel')}</Button>
          <Button onClick={confirmModal.action} variant="contained" sx={{ bgcolor: '#711c2e', '&:hover': { bgcolor: '#5a1524' } }}>{t('common.yesDelete')}</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Admin;