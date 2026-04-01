document.addEventListener("DOMContentLoaded", function() {
	
	// --- MANEJO DE RESPUESTAS DE STRIPE ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pago') === 'exito') {
        alert("¡Muchísimas gracias por tu regalo para nuestra luna de miel! ❤️✈️");
        // Limpiamos la URL para que el mensaje no vuelva a salir si recargan la página
        window.history.replaceState(null, null, window.location.pathname);
    } else if (urlParams.get('pago') === 'cancelado') {
        alert("El pago fue cancelado. No te preocupes, no se ha realizado ningún cargo.");
        window.history.replaceState(null, null, window.location.pathname);
    }
    
    // --- 1. CONFIGURACIÓN DEL MAPA ---
    // Centramos el mapa en Europa
    var map = L.map('mapa-luna-de-miel').setView([46.603354, 7.888334], 5);

    // Cargamos el diseño del mapa (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Coordenadas de las paradas
    var paradas = {
        paris: [48.8566, 2.3522],
        roma: [41.9028, 12.4964]
    };

    // Marcadores
    var markerParis = L.marker(paradas.paris).addTo(map);
    markerParis.bindPopup("<b>París, Francia</b><br>Nuestra primera parada 🗼");

    var markerRoma = L.marker(paradas.roma).addTo(map);
    markerRoma.bindPopup("<b>Roma, Italia</b><br>¡Pasta, pizza y amor! 🍝");

    // Ruta (Línea conectando los puntos)
    var latlngs = [ paradas.paris, paradas.roma ];
    var polyline = L.polyline(latlngs, {
        color: '#3f51b5', 
        weight: 4,
        dashArray: '10, 10'
    }).addTo(map);

    // Ajustar vista para que se vea toda la ruta
    map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
});

// --- 2. CONEXIÓN CON EL FUTURO BACKEND (CLOUD RUN) ---
async function regalarSegmento(nombreRegalo, monto) {
    const backendUrl = "https://api-boda-126620588755.us-central1.run.app/crear-sesion-pago"; 
    
    // Sacamos los datos de la memoria
    const nombreInvitado = localStorage.getItem('invInvitadoNombre') || "Anónimo";
    const emailInvitado = localStorage.getItem('invInvitadoEmail') || "sin_correo@email.com";

    try {
        const respuesta = await fetch(backendUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                nombre_regalo: nombreRegalo, 
                monto_usd: monto,
                url_origen: window.location.origin,
                // 👇 AÑADIMOS ESTOS DOS AL PAQUETE
                nombre_invitado: nombreInvitado,
                email_invitado: emailInvitado
            })
        });

        const data = await respuesta.json();
        
        if(data.url) {
            window.location.href = data.url; // Te lleva a Stripe
        } else {
            // Si hay un error, lo mostramos (FastAPI envía los errores en data.detail)
            alert("Hubo un problema al generar el pago: " + (data.detail || data.error || "Error desconocido"));
            console.error("Detalle del error:", data);
        }
    } catch(error) {
        console.error("Error conectando al backend:", error);
        alert("No se pudo conectar con el servidor de pagos.");
    }
}

// Función para el regalo de monto libre
function procesarAporteLibre() {
    // 1. Leer lo que escribió el invitado en la cajita
    const inputMonto = document.getElementById('monto-libre').value;
    const montoElegido = parseInt(inputMonto);

    // 2. Validar que sea un número válido y mayor a $5 (Stripe tiene mínimos de cobro)
    if (isNaN(montoElegido) || montoElegido < 5) {
        alert("Por favor, ingresa una cantidad válida (mínimo $5 USD).");
        return; // Detiene la función si hay error
    }

    // 3. Reutilizar tu función principal para enviarlo a Stripe
    // Le pasamos un nombre descriptivo y el monto que eligió la persona
    regalarSegmento('Aporte Abierto a Luna de Miel', montoElegido);
}