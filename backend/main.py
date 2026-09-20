import os
from typing import Optional
import stripe
from fastapi import FastAPI, HTTPException, Request
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

# --- 4. CREAR SESIÓN DE PAGO ---
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
                "nombre_invitado": regalo.nombre_invitado,
                "email_invitado": regalo.email_invitado,
                "moneda": moneda_usada,
                "monto_unitario": str(monto_unitario),
                "cantidad": str(regalo.cantidad)
            } 
        )
        return {"id": session.id, "url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 5. WEBHOOK DE STRIPE ---
@app.post("/webhook")
async def stripe_webhook(request: Request):
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

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Extraer datos útiles de la sesión de Stripe
        customer_details = session.get("customer_details") or {}
        metadata = session.get("metadata") or {}
        
        nombre_invitado = customer_details.get("name") or metadata.get("nombre_invitado", "Anónimo")
        email_invitado = customer_details.get("email") or metadata.get("email_invitado", "Sin email")
        monto_total = session.get("amount_total", 0) / 100
        moneda = session.get("currency", "usd").upper()
        regalo_elegido = metadata.get("regalo", "Regalo General")

        # Guardar en Firestore
        db.collection("regalos_luna_miel").add({
            "nombre": nombre_invitado,
            "email": email_invitado,
            "regalo": regalo_elegido,
            "monto": monto_total,
            "moneda": moneda,
            "stripe_session_id": session.get("id"),
            "fecha": firestore.SERVER_TIMESTAMP
        })
        print(f"¡Regalo de {nombre_invitado} por {moneda} ${monto_total} guardado en Firestore!")

    return {"status": "success"}