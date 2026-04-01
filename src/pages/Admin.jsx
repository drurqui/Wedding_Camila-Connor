import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Tab, Tabs, CircularProgress, IconButton, Divider, Grid, TextField, Button, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select } from '@mui/material';
import { collection, getDocs, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CloseIcon from '@mui/icons-material/Close';

const Admin = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState([]); 
  const [listaMaestra, setListaMaestra] = useState([]); 
  const [stats, setStats] = useState({ adultos: 0, ninos: 0, confirmados: 0, totalInvitados: 0 });
  const [nuevaInvitacion, setNuevaInvitacion] = useState({ nombre_invitacion: '', invitados: [{ nombre: '', tipo: 'adulto' }] });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rsvpEditDialogOpen, setRsvpEditDialogOpen] = useState(false);
  const [editRsvpData, setEditRsvpData] = useState(null);

  // Estados para Modales Visuales
  const [alertModal, setAlertModal] = useState({ open: false, title: 'Aviso', message: '' });
  const [confirmModal, setConfirmModal] = useState({ open: false, title: 'Confirmar', message: '', action: null });

  const fetchData = async () => {
    setLoading(true);
    let dataRsvp = []; let dataMaster = [];

    try {
      const snapRsvp = await getDocs(collection(db, "rsvps_compromiso"));
      dataRsvp = snapRsvp.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => { const dateA = a.fecha?.toMillis ? a.fecha.toMillis() : 0; const dateB = b.fecha?.toMillis ? b.fecha.toMillis() : 0; return dateB - dateA; });
      setRsvps(dataRsvp);
    } catch (error) { console.error("Error al cargar RSVPs:", error); }

    try {
      const snapMaster = await getDocs(collection(db, "invitaciones"));
      dataMaster = snapMaster.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => { const nameA = a.nombre_invitacion || ""; const nameB = b.nombre_invitacion || ""; return nameA.localeCompare(nameB); });
      setListaMaestra(dataMaster);
    } catch (error) { console.error("Error al cargar Lista Maestra:", error); }
      
    try {
      let countConfirmados = 0; let countAdultos = 0; let countNinos = 0; let countTotalInvitados = 0;
      dataRsvp.forEach(rsvp => { rsvp.invitados?.forEach(inv => { if (inv.asistencia === 'si') { countConfirmados++; if (inv.tipo === 'niño') { countNinos++; } else { countAdultos++; } } }); });
      dataMaster.forEach(m => { countTotalInvitados += (m.invitados?.length || 0); });
      setStats({ confirmados: countConfirmados, adultos: countAdultos, ninos: countNinos, totalInvitados: countTotalInvitados });
    } catch (error) { console.error("Error calculando estadísticas:", error); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const eliminarRsvp = (id) => {
    setConfirmModal({ open: true, title: 'Borrar RSVP', message: "¿Estás seguro de que deseas borrar este RSVP? Se perderá la confirmación de asistencia y selección de menú.",
      action: async () => {
        setConfirmModal({ ...confirmModal, open: false }); setLoading(true);
        try { await deleteDoc(doc(db, "rsvps_compromiso", id)); fetchData(); } 
        catch (error) { setAlertModal({ open: true, title: 'Error', message: "Error al borrar RSVP: " + error.message }); setLoading(false); }
      }
    });
  };

  const abrirModalEdicionRsvp = (rsvp) => { setEditRsvpData(JSON.parse(JSON.stringify(rsvp))); setRsvpEditDialogOpen(true); };

  const handleRsvpGuestChange = (index, field, value) => {
    const list = [...editRsvpData.invitados]; list[index][field] = value;
    if (field === 'tipo' && value === 'niño') { list[index]['starter'] = 'Menú Infantil'; list[index]['entree'] = 'Menú Infantil'; }
    setEditRsvpData({ ...editRsvpData, invitados: list });
  };

  const guardarEdicionRsvp = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "rsvps_compromiso", editRsvpData.id);
      await updateDoc(docRef, { nombre: editRsvpData.nombre, email: editRsvpData.email, invitados: editRsvpData.invitados });
      setRsvpEditDialogOpen(false); fetchData();
    } catch (error) { setAlertModal({ open: true, title: 'Error', message: "Error al actualizar RSVP: " + error.message }); setLoading(false); }
  };

  const handleAddGuestField = () => { setNuevaInvitacion({ ...nuevaInvitacion, invitados: [...nuevaInvitacion.invitados, { nombre: '', tipo: 'adulto' }] }); };
  const handleRemoveGuestField = (index) => { const list = [...nuevaInvitacion.invitados]; list.splice(index, 1); setNuevaInvitacion({ ...nuevaInvitacion, invitados: list }); };
  const handleGuestChange = (index, field, value) => { const list = [...nuevaInvitacion.invitados]; list[index][field] = value; setNuevaInvitacion({ ...nuevaInvitacion, invitados: list }); };

  const guardarNuevaInvitacion = async () => {
    if (!nuevaInvitacion.nombre_invitacion.trim()) { setAlertModal({ open: true, title: 'Aviso', message: "Asigna un nombre a la invitación." }); return; }
    if (nuevaInvitacion.invitados.some(i => i.nombre.trim() === "")) { setAlertModal({ open: true, title: 'Aviso', message: "Todos los integrantes del grupo deben tener un nombre." }); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "invitaciones"), { nombre_invitacion: nuevaInvitacion.nombre_invitacion, invitados: nuevaInvitacion.invitados, email_vinculado: "", creado_el: serverTimestamp() });
      setAlertModal({ open: true, title: 'Éxito', message: "Invitación guardada exitosamente en la Lista Maestra." });
      setNuevaInvitacion({ nombre_invitacion: '', invitados: [{ nombre: '', tipo: 'adulto' }] }); fetchData();
    } catch (e) { setAlertModal({ open: true, title: 'Error', message: "Error: " + e.message }); }
    setLoading(false);
  };

  const eliminarInvitacion = (id) => {
    setConfirmModal({ open: true, title: 'Borrar Invitación', message: "¿Estás seguro de que deseas borrar permanentemente esta invitación de la Lista Maestra?",
      action: async () => {
        setConfirmModal({ ...confirmModal, open: false }); setLoading(true);
        try { await deleteDoc(doc(db, "invitaciones", id)); fetchData(); } 
        catch (error) { setAlertModal({ open: true, title: 'Error', message: "Hubo un error al eliminar." }); setLoading(false); }
      }
    });
  };

  const abrirModalEdicion = (invitacion) => { setEditData(JSON.parse(JSON.stringify(invitacion))); setEditDialogOpen(true); };

  const guardarEdicion = async () => {
    if (!editData.nombre_invitacion.trim()) { setAlertModal({ open: true, title: 'Aviso', message: "El nombre de la invitación no puede estar vacío." }); return; }
    if (editData.invitados.some(i => i.nombre.trim() === "")) { setAlertModal({ open: true, title: 'Aviso', message: "Todos los integrantes deben tener un nombre." }); return; }
    setLoading(true);
    try {
      const docRef = doc(db, "invitaciones", editData.id);
      await updateDoc(docRef, { nombre_invitacion: editData.nombre_invitacion, invitados: editData.invitados });
      setEditDialogOpen(false); fetchData();
    } catch (error) { setAlertModal({ open: true, title: 'Error', message: "Error al guardar los cambios." }); setLoading(false); }
  };

  const headerStyle = { bgcolor: '#711c2e', color: '#ffffff', fontWeight: 'bold', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fdfbf7', pb: 10 }}>
      <Box sx={{ bgcolor: '#ffffff', borderBottom: '2px solid #711c2e', p: 4, mb: 5, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Container maxWidth="lg"><Grid container alignItems="center" justifyContent="space-between"><Grid item><Typography variant="h3" sx={{ fontFamily: "'Playfair Display', serif", color: '#711c2e', mb: 1 }}>Panel de Administración</Typography><Typography variant="subtitle1" sx={{ color: '#dabc60', fontWeight: 500, letterSpacing: '1px' }}>SHIELDS & URQUILLA • CONTROL</Typography></Grid><Grid item sx={{ display: 'flex', gap: 2 }}><Button variant="outlined" startIcon={<ExitToAppIcon />} onClick={() => window.location.href = '/'} sx={{ color: '#711c2e', borderColor: '#711c2e', fontWeight: 'bold', '&:hover': { bgcolor: '#fdfbf7', borderColor: '#5a1524' } }}>Salir</Button><IconButton onClick={fetchData} sx={{ bgcolor: '#711c2e', color: 'white', '&:hover': { bgcolor: '#5a1524' }, width: 50, height: 50 }}><RefreshIcon /></IconButton></Grid></Grid></Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={3}><Card sx={{ p: 3, textAlign: 'center', border: '1px solid #e0e0e0' }}><Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold' }}>INVITADOS</Typography><Typography variant="h4" sx={{ color: '#711c2e', fontWeight: 'bold', mt: 1 }}>{stats.totalInvitados}</Typography></Card></Grid>
          <Grid item xs={12} sm={3}><Card sx={{ p: 3, textAlign: 'center', border: '1px solid #711c2e', bgcolor: '#fffcf5' }}><Typography variant="caption" sx={{ color: '#711c2e', fontWeight: 'bold' }}>CONFIRMADOS</Typography><Typography variant="h4" sx={{ color: '#711c2e', fontWeight: 'bold', mt: 1 }}>{stats.confirmados}</Typography></Card></Grid>
          <Grid item xs={12} sm={3}><Card sx={{ p: 3, textAlign: 'center', border: '1px solid #e0e0e0' }}><Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold' }}>ADULTOS</Typography><Typography variant="h4" sx={{ color: '#dabc60', fontWeight: 'bold', mt: 1 }}>{stats.adultos}</Typography></Card></Grid>
          <Grid item xs={12} sm={3}><Card sx={{ p: 3, textAlign: 'center', border: '1px solid #e0e0e0' }}><Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold' }}>NIÑOS</Typography><Typography variant="h4" sx={{ color: '#711c2e', fontWeight: 'bold', mt: 1 }}>{stats.ninos}</Typography></Card></Grid>
        </Grid>

        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #711c2e', boxShadow: 'none' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth" indicatorColor="primary" textColor="primary" sx={{ bgcolor: '#f8f8f8', borderBottom: '1px solid #eee' }}><Tab label="RSVPs Recibidos" sx={{ fontWeight: 'bold' }} /><Tab label="Visualizar Lista Maestra" sx={{ fontWeight: 'bold' }} /><Tab label="Reporte de Cocina" sx={{ fontWeight: 'bold' }} /><Tab label="Añadir Invitación" sx={{ fontWeight: 'bold' }} /></Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 10 }}><CircularProgress size={60} sx={{ color: '#711c2e', mb: 2 }} /><Typography sx={{ color: '#711c2e', fontWeight: 500 }}>Actualizando base de datos...</Typography></Box>
          ) : (
            <Box sx={{ p: 4 }}>
              {tabValue === 0 && (
                <TableContainer><Table><TableHead><TableRow><TableCell sx={headerStyle}>Familia / Remitente</TableCell><TableCell sx={headerStyle}>Asistencia</TableCell><TableCell sx={headerStyle}>Detalle de Invitados y Menús</TableCell><TableCell sx={headerStyle} align="center">Acciones</TableCell></TableRow></TableHead>
                    <TableBody>
                      {rsvps.length > 0 ? rsvps.map((row) => (
                        <TableRow key={row.id} hover><TableCell sx={{ fontWeight: 'bold', verticalAlign: 'top' }}>{row.nombre || "Sin nombre"}<Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>{row.email}</Typography></TableCell><TableCell sx={{ verticalAlign: 'top' }}><Chip label={row.asistencia === 'si' ? "Asistirán" : "No asistirán"} color={row.asistencia === 'si' ? "success" : "error"} variant="outlined" size="small" /></TableCell>
                          <TableCell>
                            {row.invitados && Array.isArray(row.invitados) ? row.invitados.map((inv, i) => (
                              <Box key={i} sx={{ mb: 2, p: 2, bgcolor: '#fafafa', borderRadius: 1, border: '1px solid #eee' }}><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#711c2e' }}>{inv.nombre} {inv.tipo === 'niño' && '(Niño/a)'}</Typography>
                                {inv.asistencia === 'si' ? (<Box sx={{ mt: 1 }}><Typography variant="caption" display="block"><strong>Entrada:</strong> {inv.starter || "No seleccionada"}</Typography><Typography variant="caption" display="block"><strong>Plato:</strong> {inv.entree || "No seleccionado"}</Typography>{inv.dieta && inv.dieta !== 'None' && (<Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold', mt: 0.5 }} display="block">⚠️ Alergia: {inv.dieta}</Typography>)}</Box>) : (<Typography variant="caption" sx={{ color: '#bbb', fontStyle: 'italic' }}>Declinó asistencia</Typography>)}
                              </Box>
                            )) : (<Typography variant="caption" sx={{ color: '#bbb' }}>No hay invitados registrados.</Typography>)}
                          </TableCell>
                          <TableCell align="center" sx={{ verticalAlign: 'top' }}><IconButton onClick={() => abrirModalEdicionRsvp(row)} size="small" sx={{ color: '#dabc60', mr: 1 }}><EditIcon /></IconButton><IconButton onClick={() => eliminarRsvp(row.id)} size="small" color="error"><DeleteIcon /></IconButton></TableCell>
                        </TableRow>
                      )) : (<TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#888' }}>Aún no hay confirmaciones recibidas.</TableCell></TableRow>)}
                    </TableBody></Table></TableContainer>
              )}

              {tabValue === 1 && (
                <TableContainer><Table><TableHead><TableRow><TableCell sx={headerStyle}>Nombre de la Invitación</TableCell><TableCell sx={headerStyle}>Integrantes del Grupo</TableCell><TableCell sx={headerStyle}>Acceso del Invitado</TableCell><TableCell sx={headerStyle} align="center">Acciones</TableCell></TableRow></TableHead>
                    <TableBody>
                      {listaMaestra.length > 0 ? listaMaestra.map((row) => (
                        <TableRow key={row.id} hover><TableCell sx={{ fontWeight: 'bold' }}>{row.nombre_invitacion || "Sin Título"}</TableCell>
                          <TableCell>{row.invitados && Array.isArray(row.invitados) ? row.invitados.map((inv, i) => (<Chip key={i} label={inv.nombre || "Anónimo"} size="small" variant="outlined" sx={{ mr: 1, mb: 1, borderColor: inv.tipo === 'niño' ? '#dabc60' : '#ccc' }} />)) : (<Typography variant="caption" color="textSecondary">Sin datos de integrantes</Typography>)}</TableCell>
                          <TableCell>{row.email_vinculado ? (<Chip label={row.email_vinculado} size="small" color="primary" />) : (<Typography variant="caption" sx={{ color: '#bbb' }}>Pendiente de primer login</Typography>)}</TableCell>
                          <TableCell align="center"><IconButton onClick={() => abrirModalEdicion(row)} size="small" sx={{ color: '#dabc60', mr: 1 }}><EditIcon /></IconButton><IconButton onClick={() => eliminarInvitacion(row.id)} size="small" color="error"><DeleteIcon /></IconButton></TableCell>
                        </TableRow>
                      )) : (<TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#888' }}>La lista maestra está vacía.</TableCell></TableRow>)}
                    </TableBody></Table></TableContainer>
              )}

              {tabValue === 2 && (
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, height: '100%', borderTop: '4px solid #711c2e', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#711c2e', mb: 2 }}>Starters</Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        {Object.entries(rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si').reduce((acc, i) => { const plato = i.starter || "No elegido"; acc[plato] = (acc[plato] || 0) + 1; return acc; }, {})).map(([plato, total]) => (
                          <Box key={plato} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px dashed #ccc', mb: 1, gap: 2 }}><Typography variant="body2" sx={{ fontWeight: 500, flex: 1, wordBreak: 'break-word' }}>{plato}</Typography><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#711c2e', minWidth: '30px', textAlign: 'right' }}>{total}</Typography></Box>
                        ))}
                      </Box>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, height: '100%', borderTop: '4px solid #711c2e', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#711c2e', mb: 2 }}>Entrees</Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        {Object.entries(rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si').reduce((acc, i) => { const plato = i.entree || "No elegido"; acc[plato] = (acc[plato] || 0) + 1; return acc; }, {})).map(([plato, total]) => (
                          <Box key={plato} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px dashed #ccc', mb: 1, gap: 2 }}><Typography variant="body2" sx={{ fontWeight: 500, flex: 1, wordBreak: 'break-word' }}>{plato}</Typography><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#711c2e', minWidth: '30px', textAlign: 'right' }}>{total}</Typography></Box>
                        ))}
                      </Box>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, height: '100%', borderTop: '4px solid #dabc60', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#dabc60', mb: 1, textAlign: 'center', width: '100%' }}>Menú Infantil</Typography>
                      <Typography variant="h4" sx={{ color: '#711c2e', fontWeight: 'bold', my: 2, display: 'inline-flex', alignItems: 'center' }}>{rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si' && i.tipo === 'niño').length}</Typography>
                      <Typography variant="body2" sx={{ color: '#888', textAlign: 'center' }}>Total de menús para niños requeridos</Typography>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, height: '100%', borderTop: '4px solid #d32f2f', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#d32f2f', mb: 2 }}>Alergias / Restricciones</Typography>
                      <Box sx={{ flexGrow: 1, maxHeight: 300, overflow: 'auto' }}>
                        {rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si' && i.dieta && i.dieta !== 'None').map((inv, idx) => (
                            <Box key={idx} sx={{ p: 1.5, mb: 1.5, borderLeft: '3px solid #d32f2f', bgcolor: '#fff5f5', borderRadius: '0 4px 4px 0' }}><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{inv.nombre}</Typography><Typography variant="caption" sx={{ color: '#d32f2f', display: 'block', mt: 0.5 }}>{inv.dieta}</Typography></Box>
                          ))}
                        {rsvps.flatMap(r => r.invitados || []).filter(i => i.asistencia === 'si' && i.dieta && i.dieta !== 'None').length === 0 && (<Typography variant="body2" sx={{ color: '#888', fontStyle: 'italic' }}>No se han reportado alergias.</Typography>)}
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {tabValue === 3 && (
                <Box sx={{ maxWidth: 700, mx: 'auto', py: 2 }}>
                  <Typography variant="h5" sx={{ fontFamily: "'Playfair Display', serif", color: '#711c2e', mb: 4, textAlign: 'center' }}>Registrar en Lista Maestra</Typography>
                  <Card sx={{ p: 4, border: '1px solid #dabc60', boxShadow: '0 4px 15px rgba(218, 188, 96, 0.1)' }}>
                    <TextField fullWidth label="Título de la Invitación" placeholder="Ej: Familia Urquilla Bonilla" variant="outlined" value={nuevaInvitacion.nombre_invitacion} onChange={(e) => setNuevaInvitacion({...nuevaInvitacion, nombre_invitacion: e.target.value})} sx={{ mb: 4 }} />
                    <Typography variant="subtitle2" sx={{ mb: 2, color: '#711c2e', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>Integrantes del Grupo</Typography>
                    {nuevaInvitacion.invitados.map((guest, index) => (
                      <Grid container spacing={2} key={index} sx={{ mb: 3 }} alignItems="center">
                        <Grid item xs={7}><TextField fullWidth label="Nombre Completo" variant="outlined" size="small" value={guest.nombre} onChange={(e) => handleGuestChange(index, 'nombre', e.target.value)} /></Grid>
                        <Grid item xs={3}><TextField select fullWidth size="small" label="Categoría" value={guest.tipo} onChange={(e) => handleGuestChange(index, 'tipo', e.target.value)}><MenuItem value="adulto">Adulto</MenuItem><MenuItem value="niño">Niño/a</MenuItem></TextField></Grid>
                        <Grid item xs={2} sx={{ textAlign: 'center' }}><IconButton onClick={() => handleRemoveGuestField(index)} disabled={nuevaInvitacion.invitados.length === 1} color="error"><DeleteIcon /></IconButton></Grid>
                      </Grid>
                    ))}
                    <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddGuestField} sx={{ mb: 4, color: '#711c2e', fontWeight: 'bold' }}>Añadir Integrante</Button><Divider sx={{ mb: 4 }} />
                    <Button fullWidth variant="contained" size="large" onClick={guardarNuevaInvitacion} sx={{ bgcolor: '#711c2e', color: 'white', py: 2, fontWeight: 'bold', '&:hover': { bgcolor: '#5a1524' } }}>Guardar Invitación</Button>
                  </Card>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Container>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth>
        <DialogTitle sx={{ bgcolor: '#711c2e', color: 'white' }}>Editar Invitación Maestra</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {editData && (<Box><TextField fullWidth label="Título" value={editData.nombre_invitacion} onChange={(e) => setEditData({...editData, nombre_invitacion: e.target.value})} sx={{ my: 2 }} />
              {editData.invitados.map((g, i) => (
                <Grid container spacing={1} key={i} sx={{ mb: 2 }}><Grid item xs={8}><TextField fullWidth label="Nombre" size="small" value={g.nombre} onChange={(e) => { const l = [...editData.invitados]; l[i].nombre = e.target.value; setEditData({...editData, invitados: l}); }} /></Grid>
                  <Grid item xs={4}><TextField select fullWidth label="Tipo" size="small" value={g.tipo} onChange={(e) => { const l = [...editData.invitados]; l[i].tipo = e.target.value; setEditData({...editData, invitados: l}); }}><MenuItem value="adulto">Adulto</MenuItem><MenuItem value="niño">Niño</MenuItem></TextField></Grid>
                </Grid>))}
            </Box>)}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={() => setEditDialogOpen(false)}>Cerrar</Button><Button onClick={guardarEdicion} variant="contained" sx={{ bgcolor: '#711c2e' }}>Guardar</Button></DialogActions>
      </Dialog>

      <Dialog open={rsvpEditDialogOpen} onClose={() => setRsvpEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#711c2e', color: 'white' }}>Control Total RSVP</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {editRsvpData && (<Box><Grid container spacing={2} sx={{ mb: 3, mt: 1 }}><Grid item xs={12} sm={6}><TextField fullWidth label="Remitente / Familia" value={editRsvpData.nombre} onChange={(e) => setEditRsvpData({...editRsvpData, nombre: e.target.value})} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={editRsvpData.email} onChange={(e) => setEditRsvpData({...editRsvpData, email: e.target.value})} /></Grid>
              </Grid>
              <Typography variant="subtitle2" sx={{ color: '#711c2e', mb: 2, fontWeight: 'bold' }}>GESTIÓN DE INVITADOS Y MENÚS</Typography>
              {editRsvpData.invitados.map((inv, idx) => (
                <Box key={idx} sx={{ p: 2, mb: 2, border: '1px solid #ddd', borderRadius: 2, bgcolor: '#fafafa' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}><TextField fullWidth label="Nombre" size="small" value={inv.nombre} onChange={(e) => handleRsvpGuestChange(idx, 'nombre', e.target.value)} /></Grid>
                    <Grid item xs={6} sm={4}><FormControl fullWidth size="small"><InputLabel>Categoría</InputLabel><Select value={inv.tipo} label="Categoría" onChange={(e) => handleRsvpGuestChange(idx, 'tipo', e.target.value)}><MenuItem value="adulto">Adulto</MenuItem><MenuItem value="niño">Niño/a</MenuItem></Select></FormControl></Grid>
                    <Grid item xs={6} sm={4}><FormControl fullWidth size="small"><InputLabel>Asistencia</InputLabel><Select value={inv.asistencia} label="Asistencia" onChange={(e) => handleRsvpGuestChange(idx, 'asistencia', e.target.value)}><MenuItem value="si">Confirmado (Sí)</MenuItem><MenuItem value="no">Declinado (No)</MenuItem></Select></FormControl></Grid>
                    {inv.asistencia === 'si' && (
                      inv.tipo === 'niño' ? (
                        <><Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Starter (Entrada)" value="Menú Infantil" disabled sx={{ bgcolor: '#ebebeb' }} /></Grid>
                          <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Entree (Plato Fuerte)" value="Menú Infantil" disabled sx={{ bgcolor: '#ebebeb' }} /></Grid>
                          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>Alergias / Dieta</InputLabel><Select value={inv.dieta || 'None'} label="Alergias / Dieta" onChange={(e) => handleRsvpGuestChange(idx, 'dieta', e.target.value)}><MenuItem value="None">Ninguna</MenuItem><MenuItem value="Gluten free">Gluten free</MenuItem><MenuItem value="Vegetarian">Vegetariano</MenuItem><MenuItem value="Vegan">Vegano</MenuItem></Select></FormControl></Grid></>
                      ) : (
                        <><Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>Starter (Entrada)</InputLabel><Select value={inv.starter || ''} label="Starter (Entrada)" onChange={(e) => handleRsvpGuestChange(idx, 'starter', e.target.value)}><MenuItem value='Caesar Salad'>"Prince of Wales" Caesar Salad</MenuItem><MenuItem value='Tomato Soup'>Tomato Soup</MenuItem></Select></FormControl></Grid>
                          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>Entree (Plato Fuerte)</InputLabel><Select value={inv.entree || ''} label="Entree (Plato Fuerte)" onChange={(e) => handleRsvpGuestChange(idx, 'entree', e.target.value)}><MenuItem value='Grilled Chicken Breast'>Grilled Chicken Breast</MenuItem><MenuItem value='Three Cheese Tortellini'>Three Cheese Tortellini</MenuItem></Select></FormControl></Grid>
                          <Grid item xs={12} sm={4}><FormControl fullWidth size="small"><InputLabel>Alergias / Dieta</InputLabel><Select value={inv.dieta || 'None'} label="Alergias / Dieta" onChange={(e) => handleRsvpGuestChange(idx, 'dieta', e.target.value)}><MenuItem value="None">Ninguna</MenuItem><MenuItem value="Gluten free">Gluten free</MenuItem><MenuItem value="Vegetarian">Vegetariano</MenuItem><MenuItem value="Vegan">Vegano</MenuItem></Select></FormControl></Grid></>
                      )
                    )}
                  </Grid>
                </Box>))}
            </Box>)}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={() => setRsvpEditDialogOpen(false)}>Cancelar</Button><Button onClick={guardarEdicionRsvp} variant="contained" sx={{ bgcolor: '#711c2e' }}>Guardar Cambios RSVP</Button></DialogActions>
      </Dialog>

      {/* MODAL GLOBAL PARA AVISOS ADMIN */}
      <Dialog open={alertModal.open} onClose={() => setAlertModal({ ...alertModal, open: false })} PaperProps={{ sx: { borderRadius: 2, border: '2px solid #dabc60', minWidth: '300px' } }}>
        <DialogTitle sx={{ bgcolor: '#711c2e', color: 'white', fontFamily: "'Playfair Display', serif", textAlign: 'center', fontSize: '1.5rem' }}>{alertModal.title}</DialogTitle>
        <DialogContent sx={{ p: 4, textAlign: 'center', mt: 2 }}><Typography variant="body1" sx={{ color: '#5a3b45', fontWeight: 500 }}>{alertModal.message}</Typography></DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}><Button onClick={() => setAlertModal({ ...alertModal, open: false })} variant="contained" sx={{ bgcolor: '#711c2e', '&:hover': { bgcolor: '#5a1524' } }}>Entendido</Button></DialogActions>
      </Dialog>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO ADMIN */}
      <Dialog open={confirmModal.open} onClose={() => setConfirmModal({ ...confirmModal, open: false })} PaperProps={{ sx: { borderRadius: 2, border: '2px solid #dabc60', minWidth: '350px' } }}>
        <DialogTitle sx={{ bgcolor: '#711c2e', color: 'white', fontFamily: "'Playfair Display', serif", textAlign: 'center', fontSize: '1.5rem' }}>{confirmModal.title}</DialogTitle>
        <DialogContent sx={{ p: 4, textAlign: 'center', mt: 2 }}><Typography variant="body1" sx={{ color: '#5a3b45', fontWeight: 500 }}>{confirmModal.message}</Typography></DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <Button onClick={() => setConfirmModal({ ...confirmModal, open: false })} variant="outlined" sx={{ color: '#711c2e', borderColor: '#711c2e' }}>Cancelar</Button>
          <Button onClick={confirmModal.action} variant="contained" sx={{ bgcolor: '#711c2e', '&:hover': { bgcolor: '#5a1524' } }}>Sí, Borrar</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Admin;