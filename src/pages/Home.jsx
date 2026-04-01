import React, { useState } from 'react';
import { 
  Box, Container, Typography, Card, TextField, Button, Select, MenuItem, 
  FormControl, InputLabel, CircularProgress, Alert, Grid, Chip, Divider
} from '@mui/material';
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Función auxiliar para buscar nombres ignorando mayúsculas y tildes
const normalize = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const Home = () => {
  // Manejo de pantallas: 1 (Login), 2 (Formulario RSVP), 3 (Éxito)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Datos del login
  const [loginData, setLoginData] = useState({ nombre: '', email: '' });

  // Datos de la invitación cargada
  const [invitacionMaster, setInvitacionMaster] = useState(null);
  const [guestList, setGuestList] = useState([]);

  // --- PASO 1: LOGIN Y SINCRONIZACIÓN INTELIGENTE ---
  const handleLogin = async () => {
    if (!loginData.nombre || !loginData.email) {
      setError("Por favor, llena ambos campos para continuar.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const snap = await getDocs(collection(db, "invitaciones"));
      let match = null;
      let matchId = null;
      const buscado = normalize(loginData.nombre);

      // Buscamos a la familia
      snap.forEach(documento => {
        const data = documento.data();
        const enLista = data.invitados.some(i => normalize(i.nombre).includes(buscado));
        if (data.email_vinculado === loginData.email || normalize(data.nombre_invitacion).includes(buscado) || enLista) {
          match = data;
          matchId = documento.id;
        }
      });

      if (match) {
        // 1. Vincular el email si estaba vacío en la lista maestra
        if (!match.email_vinculado) {
          await setDoc(doc(db, "invitaciones", matchId), { email_vinculado: loginData.email }, { merge: true });
        }

        // 2. Buscar si esta familia ya había confirmado antes (Fusión Inteligente)
        const emailLowerCase = loginData.email.toLowerCase().trim();
        const rsvpRef = doc(db, "rsvps_compromiso", emailLowerCase);
        const rsvpSnap = await getDoc(rsvpRef);
        const rsvpData = rsvpSnap.exists() ? rsvpSnap.data() : null;

        // 3. Cruzar la lista maestra actualizada con las decisiones pasadas
        const mergedGuests = match.invitados.map(invMaster => {
          let respuestaPrevia = rsvpData?.invitados?.find(r => normalize(r.nombre) === normalize(invMaster.nombre));
          
          if (respuestaPrevia) {
            // Si ya había respondido y le cambiaron la edad en el Admin, reseteamos su comida
            if (respuestaPrevia.tipo !== invMaster.tipo) {
              return { 
                ...invMaster, 
                asistencia: respuestaPrevia.asistencia || 'si', 
                dieta: respuestaPrevia.dieta || 'None', 
                starter: invMaster.tipo === 'niño' ? 'Sin entrada (Niño)' : '', 
                entree: invMaster.tipo === 'niño' ? 'Menú Infantil' : '' 
              };
            }
            // Si todo está igual, conservamos sus decisiones
            return { ...invMaster, ...respuestaPrevia };
          } else {
            // Si es alguien nuevo, entra en blanco (con valores por defecto)
            const isNino = invMaster.tipo === 'niño';
            return {
              ...invMaster,
              asistencia: 'si',
              dieta: 'None',
              starter: isNino ? 'Sin entrada (Niño)' : '',
              entree: isNino ? 'Menú Infantil' : ''
            };
          }
        });

        setInvitacionMaster({ id: matchId, nombre_invitacion: match.nombre_invitacion, email: emailLowerCase });
        setGuestList(mergedGuests);
        setStep(2); // Pasamos al formulario
      } else {
        setError("No pudimos encontrarte en la lista. Intenta escribiendo solo tu primer nombre y primer apellido.");
      }
    } catch (e) {
      console.error(e);
      setError("Hubo un problema de conexión. Intenta de nuevo.");
    }
    setLoading(false);
  };

  // --- PASO 2: MANEJO DEL FORMULARIO DINÁMICO ---
  const handleGuestChange = (index, field, value) => {
    const newList = [...guestList];
    newList[index][field] = value;
    setGuestList(newList);
  };

  const submitRSVP = async () => {
    setLoading(true);
    setError('');

    // Validación: Si asisten, deben tener comida seleccionada (los adultos)
    let algunAsistente = false;
    for (const g of guestList) {
      if (g.asistencia === 'si') {
        algunAsistente = true;
        if (!g.starter || !g.entree) {
          setError(`Por favor selecciona la entrada y el plato fuerte para ${g.nombre}.`);
          setLoading(false);
          window.scrollTo(0, 0);
          return;
        }
      }
    }

    // Limpiamos los datos de los que no asisten antes de guardar
    const finalGuests = guestList.map(g => {
      if (g.asistencia === 'no') {
        return { ...g, dieta: 'None', starter: '', entree: '' };
      }
      return g;
    });

    const asistenciaGeneral = algunAsistente ? 'si' : 'no';

    try {
      await setDoc(doc(db, "rsvps_compromiso", invitacionMaster.email), {
        nombre: invitacionMaster.nombre_invitacion,
        email: invitacionMaster.email,
        asistencia: asistenciaGeneral,
        invitados: finalGuests,
        fecha: serverTimestamp()
      }, { merge: true });
      
      setStep(3); // Pasamos a la pantalla de éxito
      window.scrollTo(0, 0);
    } catch (e) {
      setError("Hubo un problema al guardar tu confirmación. Intenta de nuevo.");
    }
    setLoading(false);
  };

  // --- RENDERIZADO DE LAS 3 PANTALLAS ---

  if (step === 3) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'background.default', p: 3, textAlign: 'center' }}>
        <Typography variant="h1" sx={{ fontSize: { xs: '4rem', md: '6rem' }, color: 'primary.main', mb: 2 }}>¡Gracias!</Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mb: 4 }}>
          Tu confirmación se ha guardado exitosamente. ¡Nos emociona mucho poder celebrar este momento contigo!
        </Typography>
        <Button variant="outlined" color="primary" onClick={() => window.location.reload()} sx={{ borderRadius: 10, px: 4 }}>
          Volver al Inicio
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* HERO SECTION (Se muestra en paso 1 y 2) */}
      <Box sx={{ 
        height: step === 1 ? '60vh' : '40vh', 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/hampton_court.webp')`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white',
        transition: 'height 0.5s ease'
      }}>
        <Typography variant="h1" color="white" sx={{ mb: 0 }}>Shields Urquilla</Typography>
        <Typography sx={{ letterSpacing: 3, mt: 2, fontSize: { xs: '0.9rem', sm: '1.2rem' } }}>CELEBRACIÓN DE COMPROMISO</Typography>
        <Typography variant="h5" sx={{ mt: 1, fontFamily: "'Playfair Display', serif", color: 'secondary.main' }}>15 de Noviembre de 2026</Typography>
      </Box>

      <Container maxWidth="md" sx={{ mt: -6, mb: 10, position: 'relative', zIndex: 10 }}>
        
        {/* PANTALLA 1: INICIO DE SESIÓN */}
        {step === 1 && (
          <Card sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', boxShadow: 3, borderRadius: 3, border: '1px solid #d4af37' }}>
            <Typography variant="h2" color="secondary" gutterBottom>¡Bienvenidos!</Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>Por favor, identifícate para confirmar tu asistencia.</Typography>
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Box sx={{ maxWidth: 400, margin: '0 auto' }}>
              <TextField 
                fullWidth label="Tu Nombre y Apellidos" variant="outlined" margin="normal"
                value={loginData.nombre} onChange={(e) => setLoginData({...loginData, nombre: e.target.value})}
              />
              <TextField 
                fullWidth label="Tu Correo Electrónico" variant="outlined" margin="normal" type="email"
                value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              />
              <Button 
                fullWidth variant="contained" color="secondary" size="large" 
                onClick={handleLogin} disabled={loading}
                sx={{ mt: 3, borderRadius: 10, py: 1.5, fontWeight: 'bold' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Entrar a la Invitación"}
              </Button>
            </Box>
          </Card>
        )}

        {/* PANTALLA 2: FORMULARIO RSVP */}
        {step === 2 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Chip 
                label={`Invitado: ${invitacionMaster?.nombre_invitacion}`} 
                onDelete={() => setStep(1)} 
                color="default" 
                sx={{ bgcolor: 'rgba(255,255,255,0.9)', boxShadow: 1 }}
              />
            </Box>

            {/* Tarjeta de Detalles del Evento */}
            <Card sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', boxShadow: 3, borderRadius: 3, borderTop: '4px solid #711c2e', mb: 4 }}>
              <Typography variant="h4" color="primary" sx={{ fontFamily: "'Playfair Display', serif", mb: 3, lineHeight: 1.4 }}>
                Bienvenidos a la celebración de nuestro compromiso en el hermoso Prince of Wales.
              </Typography>
              
              <img src="/POW-FALL.jpeg" alt="Prince of Wales Hotel" style={{ width: '100%', maxWidth: '450px', borderRadius: '8px', marginBottom: '20px' }} />
              
              <Typography sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.8 }}>
                Experimenta la elegancia victoriana atemporal de este hermoso y preservado lugar histórico. Ubicado en el corazón de Niagara-on-the-Lake, este hotel clásico es el escenario perfecto para nuestra celebración.
              </Typography>

              <Box sx={{ bgcolor: '#fdfbf7', p: 3, borderRadius: 2, border: '1px dashed #711c2e', maxWidth: 400, mx: 'auto' }}>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  <strong style={{ color: '#711c2e' }}>Domingo, 15 de Noviembre de 2026</strong><br/>
                  Salón Hampton Court<br/>
                  Prince of Wales Hotel<br/>
                  Niagara-on-the-lake<br/>
                  <strong>12:00 PM</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                  Vestimenta Semi-Formal
                </Typography>
              </Box>
            </Card>

            {/* Tarjeta RSVP */}
            <Card sx={{ p: { xs: 3, md: 5 }, boxShadow: 3, borderRadius: 3, border: '2px solid #711c2e', mb: 4 }}>
              <Typography variant="h2" color="primary" sx={{ textAlign: 'center', mb: 1, fontFamily: "'Playfair Display', serif" }}>RSVP</Typography>
              <Typography variant="subtitle1" sx={{ textAlign: 'center', color: 'primary.main', mb: 4, fontWeight: 'medium' }}>
                Por favor confirma antes del 30 de Octubre
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

              {guestList.map((guest, index) => (
                <Box key={index} sx={{ bgcolor: '#fdfbf7', p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px dashed #711c2e', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mr: 2 }}>
                      {guest.nombre}
                    </Typography>
                    {guest.tipo === 'niño' && <Chip label="Niño/a" size="small" color="info" variant="outlined" />}
                  </Box>

                  <FormControl fullWidth margin="normal" size="small">
                    <InputLabel>¿Asistirá?</InputLabel>
                    <Select value={guest.asistencia} label="¿Asistirá?" onChange={(e) => handleGuestChange(index, 'asistencia', e.target.value)} sx={{ bgcolor: 'white' }}>
                      <MenuItem value="si">Sí asistirá</MenuItem>
                      <MenuItem value="no">No asistirá</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Mostrar opciones de comida solo si asiste */}
                  {guest.asistencia === 'si' && (
                    <Box sx={{ mt: 2, pl: { sm: 2 }, borderLeft: { sm: '3px solid #eee' } }}>
                      <FormControl fullWidth margin="normal" size="small">
                        <InputLabel>Restricciones Alimenticias</InputLabel>
                        <Select value={guest.dieta} label="Restricciones Alimenticias" onChange={(e) => handleGuestChange(index, 'dieta', e.target.value)} sx={{ bgcolor: 'white' }}>
                          <MenuItem value="None">Ninguna</MenuItem>
                          <MenuItem value="Gluten free">Gluten free</MenuItem>
                          <MenuItem value="Vegetarian">Vegetariano</MenuItem>
                          <MenuItem value="Vegan">Vegano</MenuItem>
                        </Select>
                      </FormControl>

                      {guest.tipo === 'niño' ? (
                        <Box sx={{ bgcolor: 'white', p: 2, mt: 2, borderRadius: 1, border: '1px dashed #ccc', textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                            🧸 Menú Infantil Asignado Automáticamente
                          </Typography>
                        </Box>
                      ) : (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Entrada</InputLabel>
                              <Select value={guest.starter} label="Entrada" onChange={(e) => handleGuestChange(index, 'starter', e.target.value)} sx={{ bgcolor: 'white' }}>
                                <MenuItem value="Caesar Salad">"Prince of Wales" Caesar Salad</MenuItem>
                                <MenuItem value="Tomato Soup">Tomato Soup</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Plato Fuerte</InputLabel>
                              <Select value={guest.entree} label="Plato Fuerte" onChange={(e) => handleGuestChange(index, 'entree', e.target.value)} sx={{ bgcolor: 'white' }}>
                                <MenuItem value="Grilled Chicken Breast">Grilled Chicken Breast</MenuItem>
                                <MenuItem value="Three Cheese Tortellini">Three Cheese Tortellini</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      )}
                    </Box>
                  )}
                </Box>
              ))}

              <Button 
                fullWidth variant="contained" color="primary" size="large" 
                onClick={submitRSVP} disabled={loading}
                sx={{ mt: 3, borderRadius: 10, py: 1.5, fontSize: '1.1rem' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Confirmar RSVP"}
              </Button>
            </Card>

            {/* Tarjeta Hospedaje */}
            <Card sx={{ p: { xs: 3, md: 5 }, boxShadow: 3, borderRadius: 3, mb: 4 }}>
              <Typography variant="h4" color="primary" sx={{ mb: 3 }}>Hospedaje</Typography>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" paragraph>
                    Para su comodidad, hemos reservado un bloque de habitaciones en el <strong>Prince of Wales Hotel</strong> para la noche del domingo 15 de noviembre de 2026.
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Para asegurar su habitación con tarifa especial de grupo, por favor haga su reserva en la web del hotel usando el Group ID: <strong style={{color: '#711c2e'}}>4088251</strong>
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="primary" sx={{ mb: 3, fontStyle: 'italic' }}>
                    * La tarifa de descuento de $200 aplica para habitaciones tradicionales de 1 cama Queen, 1 King, o 2 Dobles | 4 personas | 320 sq ft.
                  </Typography>
                  <Button 
                    variant="outlined" color="primary" 
                    href="https://www.vintage-hotels.com/prince-of-wales/" target="_blank"
                    sx={{ borderRadius: 10 }}
                  >
                    Visitar Sitio Web - Reservar
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <img src="/POW-Traditional-Room.webp" alt="Habitación" style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </Grid>
              </Grid>
            </Card>

            <Typography variant="h4" color="primary" sx={{ textAlign: 'center', mt: 6, fontFamily: "'Playfair Display', serif" }}>
              ¡Gracias, nos vemos pronto!
            </Typography>

          </>
        )}
      </Container>
    </Box>
  );
};

export default Home;