import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip, Tab, Tabs, 
  CircularProgress, IconButton, Divider, Grid, TextField, Button, 
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, 
  FormControl, InputLabel, Select, Tooltip 
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
import { useTranslation } from 'react-i18next';
import { getAuth, signOut } from 'firebase/auth';

const Admin = () => {
  const { t, i18n } = useTranslation();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Engagement data (untouched collections)
  const [rsvps, setRsvps] = useState([]);
  const [listaMaestra, setListaMaestra] = useState([]);
  const [stats, setStats] = useState({ totalInvitados: 0, confirmados: 0, adultos: 0, ninos: 0 });

  // Wedding data (new collection rsvps_boda)
  const [rsvpsBoda, setRsvpsBoda] = useState([]);
  const [statsBoda, setStatsBoda] = useState({ totalConfirmados: 0, totalInvitados: 0, shuttle: 0 });

  // Modals & form state
  const [nuevaInvitacion, setNuevaInvitacion] = useState({ nombre_invitacion: '', invitados: [{ nombre: '', tipo: 'adulto' }] });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rsvpEditDialogOpen, setRsvpEditDialogOpen] = useState(false);
  const [editRsvpData, setEditRsvpData] = useState(null);

  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', action: () => {} });

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('es') ? 'en' : i18n.language.startsWith('en') ? 'fr' : 'es';
    i18n.changeLanguage(nextLang);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Wedding RSVPs (rsvps_boda)
      const weddingSnap = await getDocs(collection(db, "rsvps_boda"));
      const weddingList = weddingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort newest first
      weddingList.sort((a, b) => {
        const timeA = a.creado_el?.toMillis ? a.creado_el.toMillis() : 0;
        const timeB = b.creado_el?.toMillis ? b.creado_el.toMillis() : 0;
        return timeB - timeA;
      });
      setRsvpsBoda(weddingList);

      let wConf = 0;
      let wTotal = 0;
      let wShuttle = 0;
      weddingList.forEach(item => {
        if (item.asistencia === 'si') {
          wConf += 1;
          const count = Number(item.total_invitados) || 1;
          wTotal += count;
          if (item.shuttle === 'si') {
            wShuttle += count;
          }
        }
      });
      setStatsBoda({ totalConfirmados: wConf, totalInvitados: wTotal, shuttle: wShuttle });

      // 2. Fetch Engagement RSVPs (rsvps_compromiso)
      const rsvpsSnap = await getDocs(collection(db, "rsvps_compromiso"));
      const rsvpsList = rsvpsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRsvps(rsvpsList);

      // 3. Fetch Master List (invitaciones)
      const invSnap = await getDocs(collection(db, "invitaciones"));
      const invList = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setListaMaestra(invList);

      let totalInv = 0;
      invList.forEach(inv => {
        if (inv.invitados && Array.isArray(inv.invitados)) {
          totalInv += inv.invitados.length;
        }
      });

      let conf = 0;
      let adultos = 0;
      let ninos = 0;
      rsvpsList.forEach(r => {
        if (r.asistencia === 'si' && r.invitados && Array.isArray(r.invitados)) {
          r.invitados.forEach(inv => {
            if (inv.asistencia === 'si') {
              conf += 1;
              if (inv.tipo === 'niño') ninos += 1;
              else adultos += 1;
            }
          });
        }
      });
      setStats({ totalInvitados: totalInv, confirmados: conf, adultos, ninos });

    } catch (error) {
      console.error("Error al cargar datos de administración:", error);
      setAlertModal({ open: true, title: t('common.error'), message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Wedding RSVP delete
  const eliminarRsvpBoda = (id) => {
    setConfirmModal({
      open: true,
      title: "Eliminar Registro Boda",
      message: "¿Estás seguro de que deseas eliminar este registro de RSVP de la Boda en Cartagena?",
      action: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }));
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

  // Engagement RSVP handlers
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
      await updateDoc(docRef, { nombre: editRsvpData.nombre, email: editRsvpData.email, invitados: editRsvpData.invitados });
      setRsvpEditDialogOpen(false);
      fetchData();
    } catch (error) {
      setAlertModal({ open: true, title: t('common.error'), message: t('admin.alerts.updateRsvpError') + error.message });
      setLoading(false);
    }
  };

  const eliminarRsvp = (id) => {
    setConfirmModal({
      open: true,
      title: t('admin.alerts.deleteRsvpTitle'),
      message: t('admin.alerts.deleteRsvpMsg'),
      action: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }));
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

  // Engagement Master List handlers
  const handleAddGuestField = () => {
    setNuevaInvitacion({ ...nuevaInvitacion, invitados: [...nuevaInvitacion.invitados, { nombre: '', tipo: 'adulto' }] });
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
        setConfirmModal(prev => ({ ...prev, open: false }));
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
      await updateDoc(docRef, { nombre_invitacion: editData.nombre_invitacion, invitados: editData.invitados });
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      setAlertModal({ open: true, title: t('common.error'), message: t('admin.alerts.saveChangesError') });
      setLoading(false);
    }
  };

  const headerStyle = {
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
      {/* Botón de idioma flotante */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <Button 
          variant="contained" 
          onClick={toggleLanguage} 
          sx={{ 
            borderRadius: '20px', 
            minWidth: 'auto', 
            fontWeight: 'bold',
            bgcolor: '#1e382b',
            color: '#f6ebd7',
            '&:hover': { bgcolor: '#15271e' }
          }}
        >
          {i18n.language.startsWith('es') ? 'EN' : i18n.language.startsWith('en') ? 'FR' : 'ES'}
        </Button>
      </Box>

      {/* Header Admin */}
      <Box sx={{ bgcolor: '#ffffff', borderBottom: '2px solid #1e382b', p: 4, mb: 5, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Container maxWidth="lg">
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h3" sx={{ fontFamily: "'Playfair Display', serif", color: '#1e382b', mb: 1 }}>
                {t('admin.header.title')}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#c7784f', fontWeight: 500, letterSpacing: '1px' }}>
                SHIELDS & URQUILLA • BODA CARTAGENA & COMPROMISO
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
        {/* Estadísticas Boda Cartagena (Destacadas) */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: '1.5px', color: '#1e382b' }}>
            💍 BODA EN CARTAGENA — RESUMEN EN TIEMPO REAL
          </Typography>
          <Grid container spacing={3} sx={{ mt: 0.5, mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 3, textAlign: 'center', border: '1px solid #1e382b', bgcolor: '#f9faf8' }}>
                <Typography variant="caption" sx={{ color: '#1e382b', fontWeight: 'bold' }}>
                  CONFIRMACIONES RECIBIDAS
                </Typography>
                <Typography variant="h4" sx={{ color: '#1e382b', fontWeight: 'bold', mt: 1 }}>
                  {statsBoda.totalConfirmados}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 3, textAlign: 'center', border: '1px solid #c7784f', bgcolor: '#fffbf9' }}>
                <Typography variant="caption" sx={{ color: '#c7784f', fontWeight: 'bold' }}>
                  PERSONAS TOTALES CONFIRMADAS
                </Typography>
                <Typography variant="h4" sx={{ color: '#c7784f', fontWeight: 'bold', mt: 1 }}>
                  {statsBoda.totalInvitados}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 3, textAlign: 'center', border: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
                <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold' }}>
                  PASAJEROS EN SHUTTLE BUS
                </Typography>
                <Typography variant="h4" sx={{ color: '#1e382b', fontWeight: 'bold', mt: 1, display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <DirectionsBusIcon fontSize="large" sx={{ color: '#c7784f' }} /> {statsBoda.shuttle}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Pestañas */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #1e382b', boxShadow: 'none' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            variant="scrollable"
            scrollButtons="auto"
            indicatorColor="primary" 
            textColor="primary" 
            sx={{ bgcolor: '#f8f8f8', borderBottom: '1px solid #eee' }}
          >
            <Tab label={t('admin.tabs.weddingRsvps', 'RSVPs Boda 💍')} sx={{ fontWeight: 'bold', color: tabValue === 0 ? '#1e382b' : 'inherit' }} />
            <Tab label={t('admin.tabs.rsvps', 'RSVPs Compromiso')} sx={{ fontWeight: 'bold' }} />
            <Tab label={t('admin.tabs.masterList', 'Lista Maestra')} sx={{ fontWeight: 'bold' }} />
            <Tab label={t('admin.tabs.kitchen', 'Reporte de Cocina')} sx={{ fontWeight: 'bold' }} />
            <Tab label={t('admin.tabs.addInv', 'Añadir Invitación')} sx={{ fontWeight: 'bold' }} />
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 10 }}>
              <CircularProgress size={60} sx={{ color: '#1e382b', mb: 2 }} />
              <Typography sx={{ color: '#1e382b', fontWeight: 500 }}>{t('admin.loading')}</Typography>
            </Box>
          ) : (
            <Box sx={{ p: { xs: 2, md: 4 } }}>
              
              {/* TAB 0: RSVPS BODA CARTAGENA */}
              {tabValue === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={headerStyle}>Invitado Principal</TableCell>
                        <TableCell sx={headerStyle}>Asistencia</TableCell>
                        <TableCell sx={headerStyle} align="center">Total Personas</TableCell>
                        <TableCell sx={headerStyle}>Acompañantes</TableCell>
                        <TableCell sx={headerStyle} align="center">Shuttle Bus</TableCell>
                        <TableCell sx={headerStyle}>Alergias / Dieta</TableCell>
                        <TableCell sx={headerStyle}>Mensaje</TableCell>
                        <TableCell sx={headerStyle} align="center">Acciones</TableCell>
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
                              {row.asistencia === 'si' ? (row.total_invitados || 1) : 0}
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top', maxWidth: 220 }}>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                {row.nombres_acompanantes ? row.nombres_acompanantes : <span style={{ color: '#aaa', fontStyle: 'italic' }}>Ninguno</span>}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                              {row.shuttle === 'si' ? (
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
                            Aún no hay confirmaciones recibidas para la Boda en Cartagena.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* TAB 1: RSVPS COMPROMISO */}
              {tabValue === 1 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={headerStyle}>{t('admin.table.family')}</TableCell>
                        <TableCell sx={headerStyle}>{t('admin.table.attendance')}</TableCell>
                        <TableCell sx={headerStyle}>{t('admin.table.details')}</TableCell>
                        <TableCell sx={headerStyle} align="center">{t('admin.table.actions')}</TableCell>
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
                            <Chip label={row.asistencia === 'si' ? t('admin.table.willAttend') : t('admin.table.wontAttend')} color={row.asistencia === 'si' ? "success" : "error"} variant="outlined" size="small" />
                          </TableCell>
                          <TableCell>
                            {row.invitados && Array.isArray(row.invitados) ? row.invitados.map((inv, i) => (
                              <Box key={i} sx={{ mb: 2, p: 2, bgcolor: '#fafafa', borderRadius: 1, border: '1px solid #eee' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e382b' }}>
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
                            <IconButton onClick={() => abrirModalEdicionRsvp(row)} size="small" sx={{ color: '#c7784f', mr: 1 }}><EditIcon /></IconButton>
                            <IconButton onClick={() => eliminarRsvp(row.id)} size="small" color="error"><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#888' }}>{t('admin.table.noConfirmations')}</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* TAB 2: LISTA MAESTRA */}
              {tabValue === 2 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={headerStyle}>{t('admin.table.invName')}</TableCell>
                        <TableCell sx={headerStyle}>{t('admin.table.groupMembers')}</TableCell>
                        <TableCell sx={headerStyle}>{t('admin.table.guestAccess')}</TableCell>
                        <TableCell sx={headerStyle} align="center">{t('admin.table.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {listaMaestra.length > 0 ? listaMaestra.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ fontWeight: 'bold' }}>{row.nombre_invitacion || t('admin.table.untitled')}</TableCell>
                          <TableCell>
                            {row.invitados && Array.isArray(row.invitados) ? row.invitados.map((inv, i) => (
                              <Chip key={i} label={inv.nombre || t('admin.table.anonymous')} size="small" variant="outlined" sx={{ mr: 1, mb: 1, borderColor: inv.tipo === 'niño' ? '#c7784f' : '#ccc' }} />
                            )) : (<Typography variant="caption" color="textSecondary">{t('admin.table.noMemberData')}</Typography>)}
                          </TableCell>
                          <TableCell>
                            {row.email_vinculado ? (<Chip label={row.email_vinculado} size="small" color="primary" />) : (<Typography variant="caption" sx={{ color: '#bbb' }}>{t('admin.table.pendingLogin')}</Typography>)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => abrirModalEdicion(row)} size="small" sx={{ color: '#c7784f', mr: 1 }}><EditIcon /></IconButton>
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

              {/* TAB 3: REPORTE DE COCINA (COMPROMISO) */}
              {tabValue === 3 && (
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, height: '100%', borderTop: '4px solid #1e382b', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#1e382b', mb: 2 }}>{t('admin.kitchen.starters')}</Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        {Object.entries(rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si').reduce((acc, i) => { const plato = i.starter || t('admin.kitchen.notChosen'); acc[plato] = (acc[plato] || 0) + 1; return acc; }, {})).map(([plato, total]) => (
                          <Box key={plato} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px dashed #ccc', mb: 1, gap: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, wordBreak: 'break-word' }}>{plato}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e382b', minWidth: '30px', textAlign: 'right' }}>{total}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, height: '100%', borderTop: '4px solid #1e382b', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#1e382b', mb: 2 }}>{t('admin.kitchen.entrees')}</Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        {Object.entries(rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si').reduce((acc, i) => { const plato = i.entree || t('admin.kitchen.notChosen'); acc[plato] = (acc[plato] || 0) + 1; return acc; }, {})).map(([plato, total]) => (
                          <Box key={plato} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px dashed #ccc', mb: 1, gap: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, wordBreak: 'break-word' }}>{plato}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e382b', minWidth: '30px', textAlign: 'right' }}>{total}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, height: '100%', borderTop: '4px solid #c7784f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#c7784f', mb: 1, textAlign: 'center', width: '100%' }}>{t('admin.kitchen.kidsMenu')}</Typography>
                      <Typography variant="h4" sx={{ color: '#1e382b', fontWeight: 'bold', my: 2, display: 'inline-flex', alignItems: 'center' }}>
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

              {/* TAB 4: AÑADIR INVITACIÓN (COMPROMISO) */}
              {tabValue === 4 && (
                <Box sx={{ maxWidth: 700, mx: 'auto', py: 2 }}>
                  <Typography variant="h5" sx={{ fontFamily: "'Playfair Display', serif", color: '#1e382b', mb: 4, textAlign: 'center' }}>{t('admin.addInv.title')}</Typography>
                  <Card sx={{ p: 4, border: '1px solid #c7784f', boxShadow: '0 4px 15px rgba(199, 120, 79, 0.1)' }}>
                    <TextField fullWidth label={t('admin.addInv.invTitle')} placeholder={t('admin.addInv.placeholder')} variant="outlined" value={nuevaInvitacion.nombre_invitacion} onChange={(e) => setNuevaInvitacion({...nuevaInvitacion, nombre_invitacion: e.target.value})} sx={{ mb: 4 }} />
                    <Typography variant="subtitle2" sx={{ mb: 2, color: '#1e382b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>{t('admin.addInv.membersLabel')}</Typography>
                    {nuevaInvitacion.invitados.map((guest, index) => (
                      <Grid container spacing={2} key={index} sx={{ mb: 3 }} alignItems="center">
                        <Grid item xs={7}><TextField fullWidth label={t('admin.addInv.fullName')} variant="outlined" size="small" value={guest.nombre} onChange={(e) => handleGuestChange(index, 'nombre', e.target.value)} /></Grid>
                        <Grid item xs={3}><TextField select fullWidth size="small" label={t('admin.addInv.category')} value={guest.tipo} onChange={(e) => handleGuestChange(index, 'tipo', e.target.value)}><MenuItem value="adulto">{t('admin.addInv.adult')}</MenuItem><MenuItem value="niño">{t('admin.addInv.kid')}</MenuItem></TextField></Grid>
                        <Grid item xs={2} sx={{ textAlign: 'center' }}><IconButton onClick={() => handleRemoveGuestField(index)} disabled={nuevaInvitacion.invitados.length === 1} color="error"><DeleteIcon /></IconButton></Grid>
                      </Grid>
                    ))}
                    <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddGuestField} sx={{ mb: 4, color: '#1e382b', fontWeight: 'bold' }}>{t('admin.addInv.addMemberButton')}</Button>
                    <Divider sx={{ mb: 4 }} />
                    <Button fullWidth variant="contained" size="large" onClick={guardarNuevaInvitacion} sx={{ bgcolor: '#1e382b', color: 'white', py: 2, fontWeight: 'bold', '&:hover': { bgcolor: '#15271e' } }}>{t('admin.addInv.saveInvButton')}</Button>
                  </Card>
                </Box>
              )}

            </Box>
          )}
        </Paper>
      </Container>

      {/* DIÁLOGO EDICIÓN LISTA MAESTRA */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth>
        <DialogTitle sx={{ bgcolor: '#1e382b', color: 'white' }}>{t('admin.editMaster.title')}</DialogTitle>
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
          <Button onClick={guardarEdicion} variant="contained" sx={{ bgcolor: '#1e382b', color: 'white' }}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO EDICIÓN RSVP COMPROMISO */}
      <Dialog open={rsvpEditDialogOpen} onClose={() => setRsvpEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1e382b', color: 'white' }}>{t('admin.editRsvp.title')}</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {editRsvpData && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
                <Grid item xs={12} sm={6}><TextField fullWidth label={t('admin.editRsvp.sender')} value={editRsvpData.nombre} onChange={(e) => setEditRsvpData({...editRsvpData, nombre: e.target.value})} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label={t('admin.editRsvp.email')} value={editRsvpData.email} onChange={(e) => setEditRsvpData({...editRsvpData, email: e.target.value})} /></Grid>
              </Grid>
              <Typography variant="subtitle2" sx={{ color: '#1e382b', mb: 2, fontWeight: 'bold' }}>{t('admin.editRsvp.guestManagement')}</Typography>
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
          <Button onClick={guardarEdicionRsvp} variant="contained" sx={{ bgcolor: '#1e382b', color: 'white' }}>{t('admin.editRsvp.saveButton')}</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL GLOBAL PARA AVISOS ADMIN */}
      <Dialog open={alertModal.open} onClose={() => setAlertModal({ ...alertModal, open: false })} PaperProps={{ sx: { borderRadius: 2, border: '2px solid #c7784f', minWidth: '300px' } }}>
        <DialogTitle sx={{ bgcolor: '#1e382b', color: 'white', fontFamily: "'Playfair Display', serif", textAlign: 'center', fontSize: '1.5rem' }}>{alertModal.title}</DialogTitle>
        <DialogContent sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>{alertModal.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setAlertModal({ ...alertModal, open: false })} variant="contained" sx={{ bgcolor: '#1e382b', '&:hover': { bgcolor: '#15271e' } }}>{t('common.understood')}</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO ADMIN */}
      <Dialog open={confirmModal.open} onClose={() => setConfirmModal({ ...confirmModal, open: false })} PaperProps={{ sx: { borderRadius: 2, border: '2px solid #c7784f', minWidth: '350px' } }}>
        <DialogTitle sx={{ bgcolor: '#1e382b', color: 'white', fontFamily: "'Playfair Display', serif", textAlign: 'center', fontSize: '1.5rem' }}>{confirmModal.title}</DialogTitle>
        <DialogContent sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>{confirmModal.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <Button onClick={() => setConfirmModal({ ...confirmModal, open: false })} variant="outlined" sx={{ color: '#1e382b', borderColor: '#1e382b' }}>{t('common.cancel')}</Button>
          <Button onClick={confirmModal.action} variant="contained" sx={{ bgcolor: '#1e382b', '&:hover': { bgcolor: '#15271e' } }}>{t('common.yesDelete')}</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Admin;