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
  
  // Estados para la Lista Maestra
  const [invitaciones, setInvitaciones] = useState([]);
  const [mostrarMaestra, setMostrarMaestra] = useState(true);
  
  // Estados para el formulario de nuevo grupo
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [miembros, setMiembros] = useState([{ nombre: '', tipo: 'adulto' }]);

  // Cargar datos al iniciar
  const cargarInvitaciones = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "invitaciones"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvitaciones(data);
    } catch (error) {
      console.error("Error cargando invitaciones:", error);
    }
  };

  useEffect(() => {
    cargarInvitaciones();
  }, []);

  // Manejo dinámico del formulario de miembros
  const agregarMiembroForm = () => {
    setMiembros([...miembros, { nombre: '', tipo: 'adulto' }]);
  };

  const actualizarMiembro = (index, campo, valor) => {
    const nuevosMiembros = [...miembros];
    nuevosMiembros[index][campo] = valor;
    setMiembros(nuevosMiembros);
  };

  const quitarMiembroForm = (index) => {
    const nuevosMiembros = miembros.filter((_, i) => i !== index);
    setMiembros(nuevosMiembros);
  };

  // Guardar en Firebase
  const guardarGrupo = async () => {
    if (!nombreGrupo || miembros.some(m => !m.nombre)) {
      alert("Completa el nombre del grupo y de todos los miembros.");
      return;
    }

    // Formatear datos para Firestore
    const invitadosFormateados = miembros.map(m => ({
      nombre: m.nombre,
      tipo: m.tipo,
      dieta: "None",
      starter: m.tipo === 'niño' ? 'Sin entrada (Niño)' : '',
      entree: ''
    }));

    try {
      await addDoc(collection(db, "invitaciones"), {
        nombre_invitacion: nombreGrupo,
        email_vinculado: "",
        invitados: invitadosFormateados
      });
      
      // Limpiar formulario y recargar tabla
      setNombreGrupo('');
      setMiembros([{ nombre: '', tipo: 'adulto' }]);
      cargarInvitaciones();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar.");
    }
  };

  // Borrar de Firebase
  const borrarGrupo = async (id) => {
    if(window.confirm("¿Seguro que deseas eliminar este grupo?")) {
      try {
        await deleteDoc(doc(db, "invitaciones", id));
        cargarInvitaciones();
      } catch (error) {
        console.error("Error al borrar:", error);
      }
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      <AppBar position="static" color="transparent" elevation={1} sx={{ bgcolor: 'white' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary" sx={{ fontFamily: "'Playfair Display', serif", fontWeight: 'bold' }}>
            Shields Urquilla
          </Typography>
          <Button color="error" variant="outlined" size="small" onClick={logout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" color="secondary" sx={{ textAlign: 'center', mb: 1, fontFamily: "'Playfair Display', serif" }}>
          Panel de Novios
        </Typography>
        <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
          Sesión activa: {user?.email}
        </Typography>

        {/* SECCIÓN: GESTOR DE INVITACIONES */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', pb: 2, mb: 3 }}>
            <Typography variant="h5" color="primary">📋 Gestor de Invitaciones (Maestra)</Typography>
            <Button 
              variant="outlined" 
              color="secondary" 
              endIcon={mostrarMaestra ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setMostrarMaestra(!mostrarMaestra)}
            >
              {mostrarMaestra ? 'Ocultar' : 'Mostrar'}
            </Button>
          </Box>

          <Collapse in={mostrarMaestra}>
            {/* Formulario para agregar */}
            <Card sx={{ mb: 4, border: '1px dashed #d4af37', bgcolor: '#fffdf5', boxShadow: 0 }}>
              <CardContent>
                <Typography variant="h6" color="secondary" gutterBottom>Agregar Grupo de Invitación</Typography>
                
                <TextField 
                  fullWidth 
                  label="Nombre de la Invitación (Ej: Familia Pérez)" 
                  variant="outlined" 
                  size="small" 
                  sx={{ mb: 3, bgcolor: 'white' }}
                  value={nombreGrupo}
                  onChange={(e) => setNombreGrupo(e.target.value)}
                />

                {miembros.map((miembro, index) => (
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }} key={index}>
                    <TextField 
                      fullWidth 
                      label="Nombre de la persona" 
                      size="small" 
                      sx={{ bgcolor: 'white' }}
                      value={miembro.nombre}
                      onChange={(e) => actualizarMiembro(index, 'nombre', e.target.value)}
                    />
                    <Select 
                      size="small" 
                      value={miembro.tipo} 
                      sx={{ bgcolor: 'white', minWidth: 120 }}
                      onChange={(e) => actualizarMiembro(index, 'tipo', e.target.value)}
                    >
                      <MenuItem value="adulto">Adulto</MenuItem>
                      <MenuItem value="niño">Niño</MenuItem>
                    </Select>
                    <IconButton color="error" onClick={() => quitarMiembroForm(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}

                <Button startIcon={<AddCircleOutlineIcon />} onClick={agregarMiembroForm} sx={{ mb: 2 }}>
                  Añadir Persona
                </Button>

                <Button fullWidth variant="contained" color="secondary" onClick={guardarGrupo}>
                  Guardar Invitación en Base de Datos
                </Button>
              </CardContent>
            </Card>

            {/* Tabla de Resultados */}
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
                        <IconButton color="error" onClick={() => borrarGrupo(inv.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {invitaciones.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">No hay invitaciones registradas.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Box>

      </Container>
    </Box>
  );
};

export default Admin;