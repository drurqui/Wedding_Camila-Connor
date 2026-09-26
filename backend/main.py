import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List
import stripe
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI()

# --- 1. CONFIGURACIONES IMPORTANTES ---
URL_FRONTEND = "https://shieldsurquilla.com"
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

# --- 2. INICIALIZAR FIREBASE ---
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase-key.json")
    firebase_admin.initialize_app(cred, {
        'projectId': 'boda-shields-urquilla',
    })

db = firestore.client()

# --- 3. CONFIGURACIÓN CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://shieldsurquilla.com",
        "https://boda-shields-urquilla.web.app",
        "https://boda-shields-urquilla.firebaseapp.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegaloRequest(BaseModel):
    nombre_regalo: str
    monto_usd: Optional[int] = None
    monto: Optional[int] = None
    moneda: str = "usd"
    cantidad: int = 1
    url_origen: str = "https://boda-shields-urquilla.web.app"
    nombre_invitado: str = "Anónimo"
    email_invitado: str = ""
    es_anonimo: bool = False
    idioma: Optional[str] = "es"

# --- 3.5 CONFIGURACIÓN STRIPE PUBLICA ---
@app.get("/config-stripe")
async def config_stripe():
    return {
        "publishableKey": os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    }

# --- 4. CREAR SESIÓN DE PAGO (CHECKOUT) ---
@app.post("/crear-sesion-pago")
async def crear_sesion_pago(regalo: RegaloRequest):
    try:
        # Resolver monto (compatibilidad con monto_usd o monto)
        monto_unitario = regalo.monto if regalo.monto is not None else (regalo.monto_usd or 5)
        moneda_usada = (regalo.moneda or "usd").lower()
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            customer_email=regalo.email_invitado if regalo.email_invitado else None,
            line_items=[{
                'price_data': {
                    'currency': moneda_usada,
                    'product_data': {
                        'name': f"Boda C&C • {regalo.nombre_regalo}",
                        'description': f"Regalo de luna de miel de {regalo.nombre_invitado}",
                    },
                    'unit_amount': int(monto_unitario * 100), # En centavos
                },
                'quantity': max(1, regalo.cantidad),
            }],
            mode='payment',
            success_url=f"{regalo.url_origen}?pago=exito",
            cancel_url=f"{regalo.url_origen}?pago=cancelado",
            metadata={
                "regalo": regalo.nombre_regalo,
                "nombre_invitado": "Anónimo" if regalo.es_anonimo else (regalo.nombre_invitado or "Anónimo"),
                "email_invitado": regalo.email_invitado,
                "moneda": moneda_usada,
                "monto_unitario": str(monto_unitario),
                "cantidad": str(regalo.cantidad),
                "es_anonimo": "true" if regalo.es_anonimo else "false",
                "idioma": regalo.idioma or "es"
            } 
        )
        return {"id": session.id, "url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 5. CREAR PAYMENT INTENT (STRIPE ELEMENTS) ---
@app.post("/crear-payment-intent")
async def crear_payment_intent(regalo: RegaloRequest):
    try:
        monto_unitario = regalo.monto if regalo.monto is not None else (regalo.monto_usd or 5)
        moneda_usada = (regalo.moneda or "usd").lower()
        cantidad = max(1, regalo.cantidad)
        monto_total_centavos = int(monto_unitario * cantidad * 100)
        nombre_display = "Anónimo" if regalo.es_anonimo else (regalo.nombre_invitado or "Anónimo")

        intent = stripe.PaymentIntent.create(
            amount=monto_total_centavos,
            currency=moneda_usada,
            automatic_payment_methods={"enabled": True},
            receipt_email=regalo.email_invitado if (regalo.email_invitado and "@" in regalo.email_invitado) else None,
            description=f"Boda C&C • {regalo.nombre_regalo} ({nombre_display})",
            metadata={
                "regalo": regalo.nombre_regalo,
                "nombre_invitado": nombre_display,
                "email_invitado": regalo.email_invitado,
                "moneda": moneda_usada,
                "monto_unitario": str(monto_unitario),
                "cantidad": str(cantidad),
                "es_anonimo": "true" if regalo.es_anonimo else "false",
                "idioma": regalo.idioma or "es"
            }
        )
        return {
            "clientSecret": intent.client_secret,
            "id": intent.id,
            "amount": monto_total_centavos / 100,
            "currency": moneda_usada
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 6. WEBHOOK DE STRIPE ---
@app.post("/webhook")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Payload inválido")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Firma inválida")

    event_type = event['type']

    if event_type == 'checkout.session.completed':
        session = event['data']['object']
        customer_details = session.get("customer_details") or {}
        metadata = session.get("metadata") or {}
        
        nombre_invitado = customer_details.get("name") or metadata.get("nombre_invitado", "Anónimo")
        email_invitado = customer_details.get("email") or metadata.get("email_invitado", "Sin email")
        monto_total = session.get("amount_total", 0) / 100
        moneda = session.get("currency", "usd").upper()
        regalo_elegido = metadata.get("regalo", "Regalo General")
        session_id = session.get("id")

        doc_data = {
            "nombre": nombre_invitado,
            "email": email_invitado,
            "regalo": regalo_elegido,
            "monto": monto_total,
            "moneda": moneda,
            "stripe_session_id": session_id,
            "origen": "checkout_session",
            "fecha": firestore.SERVER_TIMESTAMP
        }

        if session_id:
            db.collection("regalos_luna_miel").document(session_id).set(doc_data, merge=True)
        else:
            db.collection("regalos_luna_miel").add(doc_data)
        print(f"[Checkout] Regalo de {nombre_invitado} por {moneda} ${monto_total} guardado!")

        if email_invitado and "@" in email_invitado and email_invitado != "Sin email":
            req_agrad = AgradecimientoRegaloRequest(
                email=email_invitado,
                nombre_donante=nombre_invitado,
                regalo=regalo_elegido,
                monto=monto_total,
                moneda=moneda,
                idioma=metadata.get("idioma", "es"),
                es_anonimo=(metadata.get("es_anonimo") == "true")
            )
            background_tasks.add_task(enviar_email_agradecimiento_tarea, req_agrad, session_id)

    elif event_type == 'payment_intent.succeeded':
        intent = event['data']['object']
        metadata = intent.get("metadata") or {}
        
        # Ignorar si proviene de una Checkout Session ya procesada
        if intent.get("invoice") or intent.get("metadata", {}).get("checkout_session_id"):
            return {"status": "ignored_duplicate_checkout"}

        nombre_invitado = metadata.get("nombre_invitado") or "Anónimo"
        email_invitado = intent.get("receipt_email") or metadata.get("email_invitado", "Sin email")
        monto_total = intent.get("amount_received", intent.get("amount", 0)) / 100
        moneda = intent.get("currency", "usd").upper()
        regalo_elegido = metadata.get("regalo", "Regalo General")
        pi_id = intent.get("id")

        doc_data = {
            "nombre": nombre_invitado,
            "email": email_invitado,
            "regalo": regalo_elegido,
            "monto": monto_total,
            "moneda": moneda,
            "payment_intent_id": pi_id,
            "origen": "stripe_elements",
            "fecha": firestore.SERVER_TIMESTAMP
        }

        if pi_id:
            db.collection("regalos_luna_miel").document(pi_id).set(doc_data, merge=True)
        else:
            db.collection("regalos_luna_miel").add(doc_data)
        print(f"[Elements] Regalo de {nombre_invitado} por {moneda} ${monto_total} guardado!")

        if email_invitado and "@" in email_invitado and email_invitado != "Sin email":
            req_agrad = AgradecimientoRegaloRequest(
                email=email_invitado,
                nombre_donante=nombre_invitado,
                regalo=regalo_elegido,
                monto=monto_total,
                moneda=moneda,
                idioma=metadata.get("idioma", "es"),
                es_anonimo=(metadata.get("es_anonimo") == "true")
            )
            background_tasks.add_task(enviar_email_agradecimiento_tarea, req_agrad, pi_id)

    return {"status": "success"}


# --- 5. MODELOS Y ENDPOINT PARA CONFIRMACIÓN RSVP POR CORREO ---
class GuestItem(BaseModel):
    nombre: str
    asistencia: str = "si"
    menu: Optional[str] = "Pendiente de definir"
    alergias: Optional[str] = ""

class RSVPEmailRequest(BaseModel):
    email: str
    nombre_invitacion: str
    asistencia: str = "si"
    total_invitados: int = 1
    invitados: List[GuestItem] = []
    shuttle: str = "no"
    mensaje: Optional[str] = ""
    idioma: Optional[str] = "es"

def generar_html_email(data: RSVPEmailRequest) -> tuple[str, str]:
    lang = (data.idioma or "es").lower()
    if lang.startswith("en"):
        subject = "RSVP Confirmation • Camila & Connor Wedding"
        title = "CAMILA & CONNOR"
        subtitle = "Saturday, August 7, 2027 • Forêt, Comasagua, El Salvador"
        greeting = f"Dear {data.nombre_invitacion},"
        if data.asistencia == "si":
            intro = "We are overjoyed to know that you will be celebrating this very special day with us! We have recorded your RSVP confirmation with the following details:"
        else:
            intro = "We are so sorry that you won't be able to celebrate with us in person, but you will be in our hearts. We have recorded your response:"
        guests_header = "Guest"
        status_header = "Attendance"
        dietary_header = "Allergies / Dietary"
        attend_yes = "✓ Attending"
        attend_no = "✕ Declined"
        none_label = "None"
        menu_title = "🍽️ Menu Selection Coming Soon"
        menu_text = "The option to choose your meal will be enabled soon. We will notify you by email so you can update your selection once the menu is finalized."
        shuttle_label = "Shuttle Transportation"
        shuttle_val = "Confirmed (Hilton San Salvador ⇄ Forêt)" if data.shuttle == "si" else "Personal arrival / Independent transport"
        msg_label = "Your message for Camila & Connor:"
        dress_title = "Attire & Dress Code"
        dress_text = "Formal / Black Tie Optional. Note from the bride: Please avoid dresses in white, light yellow, or very light pastel shades."
        button_text = "Visit Wedding Portal"
        footer_sub = "Shields-Urquilla Wedding • Comasagua, El Salvador"
        footer_note = "If you have any questions or need to modify your response, visit our portal or contact us at rsvp@shieldsurquilla.com."
    elif lang.startswith("fr"):
        subject = "Confirmation RSVP • Mariage Camila & Connor"
        title = "CAMILA & CONNOR"
        subtitle = "Samedi 7 Août 2027 • Forêt, Comasagua, Salvador"
        greeting = f"Chère / Cher {data.nombre_invitacion},"
        if data.asistencia == "si":
            intro = "Nous sommes ravis et émus de célébrer ce jour si spécial avec vous ! Nous avons bien enregistré votre confirmation avec les détails suivants :"
        else:
            intro = "Nous regrettons que vous ne puissiez pas être présents physiquement parmi nous, mais vous serez dans nos cœurs. Nous avons bien enregistré votre réponse :"
        guests_header = "Invité(e)"
        status_header = "Présence"
        dietary_header = "Allergies / Régime"
        attend_yes = "✓ Présent(e)"
        attend_no = "✕ Absent(e)"
        none_label = "Aucune"
        menu_title = "🍽️ Choix du Menu Bientôt Disponible"
        menu_text = "L'option de choix des repas sera activée prochainement. Nous vous préviendrons par e-mail afin que vous puissiez faire vos choix dès que le menu sera finalisé."
        shuttle_label = "Service Navette Shuttle"
        shuttle_val = "Confirmé (Hôtel Hilton ⇄ Forêt)" if data.shuttle == "si" else "Transport personnel"
        msg_label = "Votre message pour les mariés :"
        dress_title = "Tenue & Dress Code"
        dress_text = "Tenue de soirée / Formelle. Note spéciale de la mariée : Merci d'éviter les robes blanches, jaune clair ou tons pastel très pâles."
        button_text = "Visiter le Site du Mariage"
        footer_sub = "Mariage Shields-Urquilla • Comasagua, Salvador"
        footer_note = "Pour toute question ou modification, visitez le site ou écrivez-nous à rsvp@shieldsurquilla.com."
    else:
        subject = "Confirmación de Asistencia • Boda Camila & Connor"
        title = "CAMILA & CONNOR"
        subtitle = "Sábado 7 de Agosto de 2027 • Forêt, Comasagua, El Salvador"
        greeting = f"Estimada/o {data.nombre_invitacion},"
        if data.asistencia == "si":
            intro = "¡Nos llena de inmensa alegría saber que nos acompañarás en este día tan especial para nosotros! Hemos registrado tu confirmación de asistencia con los siguientes detalles:"
        else:
            intro = "Lamentamos mucho que no puedas acompañarnos físicamente en esta ocasión, pero te llevamos con mucho cariño en el corazón. Hemos registrado tu respuesta:"
        guests_header = "Invitado"
        status_header = "Asistencia"
        dietary_header = "Alergias / Restricciones"
        attend_yes = "✓ Confirmado"
        attend_no = "✕ No asistirá"
        none_label = "Ninguna"
        menu_title = "🍽️ Selección de Menú Próximamente"
        menu_text = "La opción de elegir la comida se habilitará pronto y les notificaremos por correo electrónico para que puedan actualizar su selección una vez esté definido el menú."
        shuttle_label = "Transporte Shuttle Bus"
        shuttle_val = "Confirmado (Hotel Hilton San Salvador ⇄ Forêt)" if data.shuttle == "si" else "Transporte propio / llegada particular"
        msg_label = "Tu mensaje para los novios:"
        dress_title = "Código de Vestimenta"
        dress_text = "Formal / Etiqueta Rigurosa. Nota especial de la novia: Agradecemos evitar vestidos en color blanco, amarillo claro o tonos pastel muy claros."
        button_text = "Ver Portal de la Boda"
        footer_sub = "Shields-Urquilla Wedding • Comasagua, El Salvador"
        footer_note = "Si tienes alguna consulta o deseas actualizar tus respuestas, ingresa a nuestro portal o contáctanos a rsvp@shieldsurquilla.com."

    guests_rows = ""
    for g in data.invitados:
        is_attending = g.asistencia == "si"
        badge_bg = "#edf7ed" if is_attending else "#f5f5f5"
        badge_color = "#2e7d32" if is_attending else "#757575"
        badge_text = attend_yes if is_attending else attend_no
        allergies_text = g.alergias.strip() if (g.alergias and g.alergias.strip()) else f"<span style='color:#999;'>{none_label}</span>"
        guests_rows += f"""
        <tr style="border-bottom: 1px solid #eee8df;">
          <td style="padding: 12px 10px; font-weight: 600; color: #1e382b; font-size: 14px;">{g.nombre}</td>
          <td style="padding: 12px 10px; text-align: center;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; background-color: {badge_bg}; color: {badge_color};">
              {badge_text}
            </span>
          </td>
          <td style="padding: 12px 10px; color: #555555; font-size: 13px;">{allergies_text}</td>
        </tr>
        """

    message_block = ""
    if data.mensaje and data.mensaje.strip():
        message_block = f"""
        <div style="background-color: #faf7f2; border-left: 3px solid #c7784f; padding: 14px 18px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #c7784f; font-weight: 700;">{msg_label}</p>
          <p style="margin: 0; color: #444; font-style: italic; font-size: 14px; line-height: 1.5;">"{data.mensaje.strip()}"</p>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin: 0; padding: 25px 15px; background-color: #f6f3ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 14px; border: 1px solid #dabc60; overflow: hidden; box-shadow: 0 6px 24px rgba(30,56,43,0.08);" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Encabezado Verde Bosque & Dorado -->
          <tr>
            <td style="background-color: #1e382b; padding: 40px 30px 32px 30px; text-align: center; border-bottom: 3px solid #dabc60;">
              <p style="margin: 0 0 8px 0; font-size: 12px; letter-spacing: 3px; color: #dabc60; text-transform: uppercase; font-weight: 700;">SHIELDS - URQUILLA</p>
              <h1 style="margin: 0; font-family: Georgia, 'Playfair Display', serif; font-size: 28px; letter-spacing: 2px; color: #ffffff; font-weight: normal;">{title}</h1>
              <div style="width: 40px; height: 1px; background-color: #dabc60; margin: 12px auto;"></div>
              <p style="margin: 0; font-size: 12px; color: #e2ede5; letter-spacing: 1.5px; text-transform: uppercase;">{subtitle}</p>
            </td>
          </tr>

          <!-- Cuerpo Principal -->
          <tr>
            <td style="padding: 35px 30px 25px 30px;">
              <h2 style="margin: 0 0 14px 0; color: #1e382b; font-family: Georgia, serif; font-size: 22px; font-weight: 600;">{greeting}</h2>
              <p style="margin: 0 0 25px 0; color: #4a554e; font-size: 15px; line-height: 1.65;">{intro}</p>

              <!-- Tabla de Invitados -->
              <table role="presentation" width="100%" style="border-collapse: collapse; margin-bottom: 25px; background-color: #ffffff; border-radius: 8px; border: 1px solid #eee8df; overflow: hidden;" border="0" cellspacing="0" cellpadding="0">
                <thead>
                  <tr style="background-color: #f7f5f0; border-bottom: 2px solid #e0d8cc;">
                    <th style="padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #1e382b;">{guests_header}</th>
                    <th style="padding: 12px 10px; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #1e382b;">{status_header}</th>
                    <th style="padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #1e382b;">{dietary_header}</th>
                  </tr>
                </thead>
                <tbody>
                  {guests_rows}
                </tbody>
              </table>

              <!-- Aviso de Menú Próximamente -->
              <div style="background-color: #f4f7f4; border: 1px solid #c9d8ce; border-radius: 8px; padding: 18px 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 6px 0; font-weight: 700; color: #1e382b; font-size: 14px;">{menu_title}</p>
                <p style="margin: 0; color: #4a5b50; font-size: 13px; line-height: 1.55;">{menu_text}</p>
              </div>

              <!-- Información de Shuttle -->
              <div style="background-color: #faf8f5; border: 1px solid #ede4d8; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #c7784f; font-weight: 700;">🚌 {shuttle_label}</p>
                <p style="margin: 0; color: #1e382b; font-size: 14px; font-weight: 600;">{shuttle_val}</p>
              </div>

              <!-- Mensaje Personal (si existe) -->
              {message_block}

              <!-- Código de Vestimenta -->
              <div style="background-color: #fbfbfb; border-left: 3px solid #1e382b; padding: 14px 18px; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #1e382b; font-weight: 700;">👔 {dress_title}</p>
                <p style="margin: 0; color: #555555; font-size: 13px; line-height: 1.55;">{dress_text}</p>
              </div>

              <!-- Botón Portal Boda -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 15px; margin-bottom: 10px;">
                <tr>
                  <td align="center">
                    <a href="https://shieldsurquilla.com/wedding" style="background-color: #1e382b; color: #ffffff; padding: 14px 34px; text-decoration: none; border-radius: 28px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 3px 10px rgba(30,56,43,0.2);">
                      {button_text}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #f7f5f0; padding: 25px 25px; text-align: center; border-top: 1px solid #eee8df;">
              <p style="margin: 0 0 6px 0; color: #1e382b; font-weight: 700; font-size: 13px; letter-spacing: 1px;">{footer_sub}</p>
              <p style="margin: 0; color: #777777; font-size: 12px; line-height: 1.5;">{footer_note}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return subject, html

def enviar_email_rsvp_tarea(data: RSVPEmailRequest):
    smtp_host = os.getenv("SMTP_HOST", "mailout.easymail.ca")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "rsvp@shieldsurquilla.com")
    smtp_password = os.getenv("SMTP_PASSWORD", "Turk182*0840")
    from_name = os.getenv("SMTP_FROM_NAME", "Shields-Urquilla Wedding")
    from_email = os.getenv("SMTP_FROM_EMAIL", "rsvp@shieldsurquilla.com")

    subject, html_content = generar_html_email(data)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = data.email
    msg["Reply-To"] = from_email

    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        if smtp_port == 465:
            import ssl
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=15) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        print(f"[RSVP Email] Enviado con éxito a {data.email} ({data.nombre_invitacion})")
    except Exception as e:
        print(f"[RSVP Email Error] Fallo al enviar a {data.email}: {e}")

@app.post("/enviar-confirmacion-rsvp")
async def enviar_confirmacion_rsvp(request: RSVPEmailRequest, background_tasks: BackgroundTasks):
    if not request.email or "@" not in request.email:
        raise HTTPException(status_code=400, detail="Dirección de correo inválida")
    
    background_tasks.add_task(enviar_email_rsvp_tarea, request)
    return {"status": "queued", "message": "Confirmación enviada en segundo plano"}


# --- 6. MODELO Y ENVÍO DE EMAIL DE AGRADECIMIENTO POR REGALO ---
class AgradecimientoRegaloRequest(BaseModel):
    email: str
    nombre_donante: Optional[str] = "Anónimo"
    regalo: str = "Luna de Miel"
    monto: float = 0.0
    moneda: str = "USD"
    idioma: Optional[str] = "es"
    es_anonimo: bool = False

def generar_html_email_agradecimiento_regalo(data: AgradecimientoRegaloRequest) -> tuple[str, str]:
    lang = (data.idioma or "es").lower()
    es_anonimo = data.es_anonimo or (not data.nombre_donante or data.nombre_donante.strip().lower() in ["anónimo", "anonimo", "anonymous"])
    nombre_mostrar = data.nombre_donante.strip() if (not es_anonimo and data.nombre_donante) else ""
    monto_fmt = f"${data.monto:,.2f} {data.moneda.upper()}"

    if lang.startswith("en"):
        subject = "Thank you from the bottom of our hearts! • Camila & Connor"
        header_pre = "CAMILA & CONNOR"
        header_sub = "Honeymoon Registry • August 7, 2027"
        greeting = f"Dear {nombre_mostrar}," if nombre_mostrar else "Dear Friend,"
        headline = "Thank You for Your Generous Gift!"
        intro = "We want to thank you from the bottom of our hearts for your sweet gift and contribution to our Honeymoon. Your love, warm wishes, and generous support mean the world to us."
        summary_title = "YOUR GIFT SUMMARY"
        item_label = "Honeymoon Experience:"
        amount_label = "Amount Contributed:"
        donor_label = "From:"
        donor_val = nombre_mostrar if nombre_mostrar else "Anonymous Contributor"
        body_msg = "Thanks to your kindness, we will be able to enjoy unique experiences and build memories that we will cherish for a lifetime as we embark on this new journey together as husband and wife."
        closing = "With all our love and gratitude,"
        couples = "Camila & Connor"
        btn_text = "Visit Wedding Website"
        footer_line1 = "Shields-Urquilla Wedding • Comasagua, El Salvador"
        footer_line2 = "Thank you for being part of our story and celebrating with us."
    elif lang.startswith("fr"):
        subject = "Merci infiniment du fond du cœur ! • Camila & Connor"
        header_pre = "CAMILA & CONNOR"
        header_sub = "Voyage de Noces • 7 Août 2027"
        greeting = f"Cher/Chère {nombre_mostrar}," if nombre_mostrar else "Chère amie, cher ami,"
        headline = "Merci infiniment pour votre don !"
        intro = "Nous tenons à vous remercier du fond du cœur pour votre magnifique cadeau et votre contribution à notre voyage de noces. Votre affection, vos vœux chaleureux et votre générosité nous touchent profondément."
        summary_title = "DÉTAILS DE VOTRE CONTRIBUTION"
        item_label = "Expérience / Cadeau :"
        amount_label = "Montant offert :"
        donor_label = "De la part de :"
        donor_val = nombre_mostrar if nombre_mostrar else "Donateur Anonyme"
        body_msg = "Grâce à votre gentillesse, nous pourrons vivre des moments uniques et bâtir des souvenirs précieux que nous chérirons pour toujours alors que nous entamons cette merveilleuse aventure à deux."
        closing = "Avec tout notre amour et notre gratitude,"
        couples = "Camila & Connor"
        btn_text = "Visiter le site du mariage"
        footer_line1 = "Mariage Shields-Urquilla • Comasagua, Salvador"
        footer_line2 = "Merci de faire partie de notre histoire et de célébrer ce moment avec nous."
    else:
        subject = "¡De todo corazón, muchas gracias! • Camila & Connor"
        header_pre = "CAMILA & CONNOR"
        header_sub = "Luna de Miel • 7 de Agosto, 2027"
        greeting = f"Estimado/a {nombre_mostrar}," if nombre_mostrar else "Querido/a amigo/a,"
        headline = "¡Gracias por tu hermoso detalle!"
        intro = "Queremos agradecerte de todo corazón por tu generoso aporte para nuestra Luna de Miel. Tu cariño, tus buenos deseos y tu generosidad significan el mundo para nosotros en esta etapa tan especial de nuestras vidas."
        summary_title = "DETALLES DE TU APORTE"
        item_label = "Experiencia / Regalo:"
        amount_label = "Monto Aportado:"
        donor_label = "De parte de:"
        donor_val = nombre_mostrar if nombre_mostrar else "Aporte Anónimo"
        body_msg = "Gracias a tu apoyo podremos disfrutar de momentos únicos y crear recuerdos inolvidables que atesoraremos por siempre al comenzar nuestro camino juntos como esposos."
        closing = "Con todo nuestro amor y agradecimiento,"
        couples = "Camila & Connor"
        btn_text = "Visitar Portal de la Boda"
        footer_line1 = "Boda Shields-Urquilla • Comasagua, El Salvador"
        footer_line2 = "Gracias por formar parte de nuestra historia y celebrar con nosotros."

    html = f"""<!DOCTYPE html>
<html lang="{lang[:2]}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f2eb; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #222222;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f2eb; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal (Tarjeta estilo Wedding con radio 0 en borde izquierdo) -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 0 16px 16px 0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-left: 6px solid #c7784f;">
          
          <!-- Encabezado Forest Green con Acento Cobre -->
          <tr>
            <td style="background-color: #1e382b; padding: 36px 30px 30px 30px; text-align: center; border-bottom: 2px solid #dfaf74;">
              <p style="margin: 0 0 6px 0; color: #dfaf74; font-size: 11px; letter-spacing: 3px; font-weight: 700; text-transform: uppercase;">
                {header_pre}
              </p>
              <h1 style="margin: 0 0 8px 0; font-family: 'Playfair Display', Georgia, serif; color: #f6ebd7; font-size: 26px; font-weight: 700; letter-spacing: 1px;">
                {headline}
              </h1>
              <p style="margin: 0; color: #dfaf74; font-size: 12px; letter-spacing: 1.5px; opacity: 0.9;">
                {header_sub}
              </p>
            </td>
          </tr>

          <!-- Cuerpo del Correo -->
          <tr>
            <td style="padding: 35px 35px 25px 35px;">
              
              <!-- Saludo -->
              <p style="margin: 0 0 16px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 19px; color: #1e382b; font-weight: 700;">
                {greeting}
              </p>

              <!-- Texto Introductorio -->
              <p style="margin: 0 0 24px 0; font-size: 14.5px; line-height: 1.7; color: #444444;">
                {intro}
              </p>

              <!-- Tarjeta de Resumen del Aporte -->
              <div style="background-color: #faf7f2; border: 1px solid #ebd9c8; border-left: 4px solid #c7784f; border-radius: 0 10px 10px 0; padding: 20px 22px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #c7784f; text-transform: uppercase;">
                  ✨ {summary_title}
                </p>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13.5px;">
                  <tr>
                    <td style="padding: 5px 0; color: #777777; width: 40%;">{item_label}</td>
                    <td style="padding: 5px 0; color: #1e382b; font-weight: 700;">{data.regalo}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #777777;">{amount_label}</td>
                    <td style="padding: 5px 0; color: #c7784f; font-weight: 800; font-size: 15px;">{monto_fmt}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #777777;">{donor_label}</td>
                    <td style="padding: 5px 0; color: #444444; font-weight: 600;">{donor_val}</td>
                  </tr>
                </table>
              </div>

              <!-- Mensaje Emocional -->
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.7; color: #555555;">
                {body_msg}
              </p>

              <!-- Firma Romántica -->
              <div style="margin: 25px 0 30px 0; padding-top: 15px; border-top: 1px dashed #ebd9c8;">
                <p style="margin: 0 0 4px 0; font-size: 13px; color: #777777;">
                  {closing}
                </p>
                <p style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 21px; color: #1e382b; font-weight: 700;">
                  {couples}
                </p>
              </div>

              <!-- Botón de Enlace al Sitio -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; margin-bottom: 10px;">
                <tr>
                  <td align="center">
                    <a href="https://boda-shields-urquilla.web.app/boda" style="background-color: #1e382b; color: #ffffff; padding: 14px 34px; text-decoration: none; border-radius: 0 12px 12px 0; font-weight: 700; font-size: 13.5px; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 4px 12px rgba(30,56,43,0.25);">
                      {btn_text}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #f7f5f0; padding: 22px 25px; text-align: center; border-top: 1px solid #eee8df;">
              <p style="margin: 0 0 5px 0; color: #1e382b; font-weight: 700; font-size: 12px; letter-spacing: 1px;">
                {footer_line1}
              </p>
              <p style="margin: 0; color: #888888; font-size: 11.5px; line-height: 1.5;">
                {footer_line2}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return subject, html

def enviar_email_agradecimiento_tarea(data: AgradecimientoRegaloRequest, doc_id: Optional[str] = None):
    if not data.email or "@" not in data.email:
        return

    # Evitar duplicados si ya se envió para esta transacción
    if doc_id:
        try:
            doc_ref = db.collection("regalos_luna_miel").document(doc_id)
            doc_snap = doc_ref.get()
            if doc_snap.exists and doc_snap.to_dict().get("email_agradecimiento_enviado"):
                print(f"[Gift Email] Ya enviado previamente para {doc_id}, omitiendo duplicado.")
                return
        except Exception as e:
            print(f"[Gift Email Check Error] {e}")

    smtp_host = os.getenv("SMTP_HOST", "mailout.easymail.ca")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "rsvp@shieldsurquilla.com")
    smtp_password = os.getenv("SMTP_PASSWORD", "Turk182*0840")
    from_name = os.getenv("SMTP_FROM_NAME", "Shields-Urquilla Wedding")
    from_email = os.getenv("SMTP_FROM_EMAIL", "rsvp@shieldsurquilla.com")

    subject, html_content = generar_html_email_agradecimiento_regalo(data)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = data.email
    msg["Reply-To"] = from_email

    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        if smtp_port == 465:
            import ssl
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=15) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        print(f"[Gift Email] Agradecimiento enviado con éxito a {data.email} ({data.nombre_donante})")

        # Marcar como enviado en Firestore
        if doc_id:
            try:
                db.collection("regalos_luna_miel").document(doc_id).set({"email_agradecimiento_enviado": True}, merge=True)
            except Exception:
                pass
    except Exception as e:
        print(f"[Gift Email Error] Fallo al enviar a {data.email}: {e}")

@app.post("/enviar-agradecimiento-regalo")
async def enviar_agradecimiento_regalo(request: AgradecimientoRegaloRequest, background_tasks: BackgroundTasks):
    if not request.email or "@" not in request.email:
        return {"status": "skipped", "message": "Email no proporcionado o inválido"}
    
    background_tasks.add_task(enviar_email_agradecimiento_tarea, request)
    return {"status": "queued", "message": "Email de agradecimiento en cola"}

