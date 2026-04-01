import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, AppBar, Toolbar, Button, Card, CardContent, 
  TextField, Select, MenuItem, IconButton, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Collapse, Stack 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { useAuth } from '../context/AuthContext';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const Admin = () => {
  const { user, logout } = useAuth();
  
  // Estados para todas las tablas
  const [invitaciones, setInvitaciones] = useState([]);
  const [rsvpsCompromiso, setRsvpsCompromiso] = useState([]);
  const [rsvpsBoda, setRsvpsBoda] = useState([]);
  const [regalos, setRegalos] = useState([]);
  
  const [mostrarMaestra, setMostrarMaestra] = useState(false); // Falso por defecto para que inicie oculta
  
  // Estados para el formulario de nuevo grupo
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [miembros, setMiembros] = useState([{ nombre: '', tipo: 'adulto' }]);

  // Cargar TODOS los datos al iniciar
  const cargarDatos = async () => {
    try {
      // 1. Invitaciones (Maestra)
      const invSnap = await getDocs(collection(db, "invitaciones"));
      setInvitaciones(invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 2. RSVP Compromiso
      const compSnap = await getDocs(collection(db, "rsvps_compromiso"));
      setRsvpsCompromiso(compSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 3. RSVP Boda
      const bodaSnap = await getDocs(collection(db, "rsvps_boda"));
      setRsvpsBoda(bodaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 4. Regalos
      const regalosSnap = await getDocs(collection(db, "regalos_luna_miel"));
      setRegalos(regalosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Manejo dinámico del formulario de miembros
  const agregarMiembroForm = () => setMiembros([...miembros, { nombre: '', tipo: 'adulto' }]);
  
  const actualizarMiembro = (index, campo, valor) => {
    const nuevosMiembros = [...miembros];
    nuevosMiembros[index][campo] = valor;
    setMiembros(nuevosMiembros);
  };

  const quitarMiembroForm = (index) => setMiembros(miembros.filter((_, i) => i !== index));

  // Guardar en Firebase
  const guardarGrupo = async () => {
    if (!nombreGrupo || miembros.some(m => !m.nombre)) {
      alert("Completa el nombre del grupo y de todos los miembros.");
      return;
    }

    const invitadosFormateados = miembros.map(m => ({
      nombre: m.nombre, tipo: m.tipo, dieta: "None",
      starter: m.tipo === 'niño' ? 'Sin entrada (Niño)' : '', entree: ''
    }));

    try {
      await addDoc(collection(db, "invitaciones"), {
        nombre_invitacion: nombreGrupo, email_vinculado: "", invitados: invitadosFormateados
      });
      setNombreGrupo('');
      setMiembros([{ nombre: '', tipo: 'adulto' }]);
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar.");
    }
  };

  // Borrar cualquier documento de cualquier colección
  const borrarRegistro = async (coleccion, id) => {
    if(window.confirm(`¿Seguro que deseas eliminar este registro de ${coleccion}?`)) {
      try {
        await deleteDoc(doc(db, coleccion, id));
        cargarDatos();
      } catch (error) {
        console.error("Error al borrar:", error);
      }
    }
  };

  // Calcular total de regalos
  const totalRecaudado = regalos.reduce((acc, curr) => acc + (Number(curr.monto_usd) || 0), 0);

  return (
    <Box sx={{ pb: 10 }}>
      <AppBar position="static" color="transparent" elevation={1} sx={{ bgcolor: 'white' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary" sx={{ fontFamily: "'Playfair Display', serif", fontWeight: 'bold' }}>
            Shields Urquilla
          </Typography>
          <Button color="error" variant="outlined" size="small" onClick={logout}>Cerrar Sesión</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" color="secondary" sx={{ textAlign: 'center', mb: 1, fontFamily: "'Playfair Display', serif" }}>
          Panel de Novios
        </Typography>
        <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
          Sesión activa: {user?.email}
        </Typography>

        {/* SECCIÓN 1: GESTOR DE INVITACIONES */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', pb: 2, mb: 3 }}>
            <Typography variant="h5" color="primary">📋 Gestor de Invitaciones (Maestra)</Typography>
            <Button variant="outlined" color="secondary" endIcon={mostrarMaestra ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setMostrarMaestra(!mostrarMaestra)}>
              {mostrarMaestra ? 'Ocultar' : 'Mostrar'}
            </Button>
          </Box>

          <Collapse in={mostrarMaestra}>
            <Card sx={{ mb: 4, border: '1px dashed #d4af37', bgcolor: '#fffdf5', boxShadow: 0 }}>
              <CardContent>
                <Typography variant="h6" color="secondary" gutterBottom>Agregar Grupo de Invitación</Typography>
                <TextField fullWidth label="Nombre de la Invitación (Ej: Familia Pérez)" variant="outlined" size="small" sx={{ mb: 3, bgcolor: 'white' }} value={nombreGrupo} onChange={(e) => setNombreGrupo(e.target.value)} />
                {miembros.map((miembro, index) => (
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }} key={index}>
                    <TextField fullWidth label="Nombre de la persona" size="small" sx={{ bgcolor: 'white' }} value={miembro.nombre} onChange={(e) => actualizarMiembro(index, 'nombre', e.target.value)} />
                    <Select size="small" value={miembro.tipo} sx={{ bgcolor: 'white', minWidth: 120 }} onChange={(e) => actualizarMiembro(index, 'tipo', e.target.value)}>
                      <MenuItem value="adulto">Adulto</MenuItem>
                      <MenuItem value="niño">Niño</MenuItem>
                    </Select>
                    <IconButton color="error" onClick={() => quitarMiembroForm(index)}><DeleteIcon /></IconButton>
                  </Stack>
                ))}
                <Button startIcon={<AddCircleOutlineIcon />} onClick={agregarMiembroForm} sx={{ mb: 2 }}>Añadir Persona</Button>
                <Button fullWidth variant="contained" color="secondary" onClick={guardarGrupo}>Guardar Invitación en Base de Datos</Button>
              </CardContent>
            </Card>

            <TableContainer component={Paper} elevation={2}>
              <Table>
                <TableHead sx={{ bgcolor: '#fafafa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Nombre de Invitación</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Integrantes</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Email Vinculado</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#711c2e' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitaciones.map((inv) => (
                    <TableRow key={inv.id} hover>
                      <TableCell><strong>{inv.nombre_invitacion}</strong></TableCell>
                      <TableCell>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          {inv.invitados.map((i, idx) => (
                            <li key={idx}>{i.nombre} <Typography component="span" variant="caption" color="text.secondary">({i.tipo})</Typography></li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>{inv.email_vinculado || '---'}</TableCell>
                      <TableCell align="center">
                        <IconButton color="error" onClick={() => borrarRegistro('invitaciones', inv.id)}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Box>

        {/* SECCIÓN 2: RSVP COMPROMISO */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" color="primary" sx={{ borderBottom: '1px solid #eee', pb: 2, mb: 3 }}>💍 RSVP - Fiesta de Compromiso</Typography>
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead sx={{ bgcolor: '#fafafa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Invitado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Correo Electrónico</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Respuesta</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#711c2e' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rsvpsCompromiso.map((rsvp) => (
                  <TableRow key={rsvp.id} hover>
                    <TableCell><strong>{rsvp.nombre}</strong></TableCell>
                    <TableCell>{rsvp.email}</TableCell>
                    <TableCell>
                      {rsvp.invitados && rsvp.invitados.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 15, fontSize: '0.9rem' }}>
                          {rsvp.invitados.map((inv, idx) => (
                            <li key={idx} style={{ marginBottom: '8px' }}>
                              {inv.asistencia === 'si' ? (
                                <>
                                  <strong style={{ color: '#2e7d32' }}>✅ {inv.nombre}</strong><br/>
                                  <span style={{ color: '#666', fontSize: '0.85em' }}>Dieta: {inv.dieta} | {inv.starter} / {inv.entree}</span>
                                </>
                              ) : (
                                <>
                                  <strong style={{ color: '#d9534f' }}>❌ {inv.nombre}</strong> <span style={{ color: '#666', fontSize: '0.85em' }}>(No asistirá)</span>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Typography color="error">Sin datos de menú</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => borrarRegistro('rsvps_compromiso', rsvp.id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* SECCIÓN 3: RSVP BODA FORMAL */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" color="primary" sx={{ borderBottom: '1px solid #eee', pb: 2, mb: 3 }}>🕊️ RSVP - Boda Formal</Typography>
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead sx={{ bgcolor: '#fafafa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Invitado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Correo Electrónico</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Respuesta</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#711c2e' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rsvpsBoda.map((rsvp) => (
                  <TableRow key={rsvp.id} hover>
                    <TableCell><strong>{rsvp.nombre}</strong></TableCell>
                    <TableCell>{rsvp.email}</TableCell>
                    <TableCell>{rsvp.asistencia === 'si' ? '✅ Sí asistirá' : '❌ No asistirá'}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => borrarRegistro('rsvps_boda', rsvp.id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* SECCIÓN 4: REGALOS LUNA DE MIEL */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" color="primary" sx={{ borderBottom: '1px solid #eee', pb: 2, mb: 3 }}>🌍 Regalos - Luna de Miel</Typography>
          <Box sx={{ bgcolor: '#fffdf5', p: 3, borderRadius: 2, textAlign: 'right', border: '1px dashed #d4af37', mb: 3 }}>
            <Typography variant="h6" color="text.secondary" component="span" sx={{ mr: 2 }}>Total Recaudado:</Typography>
            <Typography variant="h4" color="secondary" component="span" sx={{ fontFamily: "'Playfair Display', serif", fontWeight: 'bold' }}>
              ${totalRecaudado} USD
            </Typography>
          </Box>
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead sx={{ bgcolor: '#fafafa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Invitado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Correo Electrónico</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#711c2e' }}>Detalle del Regalo</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#711c2e' }}>Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {regalos.map((regalo) => (
                  <TableRow key={regalo.id} hover>
                    <TableCell>{regalo.nombre}</TableCell>
                    <TableCell>{regalo.email}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{regalo.regalo}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>${regalo.monto_usd}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

      </Container>
    </Box>
  );
};

export default Admin;