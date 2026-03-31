import os
import stripe
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import firestore

app = FastAPI()

# --- 1. CONFIGURACIONES IMPORTANTES ---
URL_FRONTEND = "https://shieldsurquilla.com"
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

# --- 2. INICIALIZAR FIREBASE ---
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    # 1. Cargamos las credenciales
    cred = credentials.Certificate("firebase-key.json")
    
    # 2. Inicializamos la app forzando el ID del proyecto correcto
    firebase_admin.initialize_app(cred, {
        'projectId': 'boda-shields-urquilla', # <-- ¡REEMPLAZA ESTO SI ES DIFERENTE!
    })

# 3. Y MUY IMPORTANTE: Forzamos también el cliente de Firestore al proyecto correcto
db = firestore.client()

# --- 3. CONFIGURACIÓN CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://shieldsurquilla.com",
        "https://boda-shields-urquilla.web.app",
        "http://localhost:5000",
        "http://127.0.0.1:5000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegaloRequest(BaseModel):
    nombre_regalo: str
    monto_usd: int
    url_origen: str = "https://shieldsurquilla.com"
    nombre_invitado: str = "Anónimo" # Nuevo
    email_invitado: str = "" # Nuevo

# --- 4. CREAR SESIÓN DE PAGO ---
@app.post("/crear-sesion-pago")
async def crear_sesion_pago(regalo: RegaloRequest):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            customer_email=regalo.email_invitado, # ¡ESTO PRE-LLENA EL CORREO EN STRIPE!
            line_items=[{
                # ... (lo demás queda igual)
            }],
            mode='payment',
            success_url=f"{regalo.url_origen}?pago=exito",
            cancel_url=f"{regalo.url_origen}?pago=cancelado",
            # 👇 GUARDAMOS ESTO EN LA METADATA PARA QUE STRIPE NOS LO DEVUELVA
            metadata={
                "regalo": regalo.nombre_regalo,
                "nombre_invitado": regalo.nombre_invitado,
                "email_invitado": regalo.email_invitado
            } 
        )
        return {"id": session.id, "url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 5. WEBHOOK DE STRIPE ---
@app.post("/webhook")
async def stripe_webhook(request: Request):
    # Stripe requiere leer el cuerpo crudo de la petición para verificar la firma
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Payload inválido")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Firma inválida")

    # Si el pago fue exitoso, guardamos los datos en Firestore
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Extraer datos útiles de la sesión de Stripe
        nombre_invitado = session.get("customer_details", {}).get("name", "Anónimo")
        email_invitado = session.get("customer_details", {}).get("email", "Sin email")
        monto_pagado = session.get("amount_total", 0) / 100 # Convertir de centavos a euros
        regalo_elegido = session.get("metadata", {}).get("regalo", "Regalo General")

        # Guardar en la colección "regalos_luna_miel" en Firestore
        metadata = session.get('metadata', {})
            
        db.collection("regalos_luna_miel").add({
            "nombre": metadata.get("nombre_invitado", "Anónimo"),
            "email": metadata.get("email_invitado", "Sin correo"),
            "regalo": metadata.get("regalo", "Regalo Desconocido"),
            "monto_usd": amount_total / 100,
            "fecha": firestore.SERVER_TIMESTAMP
        })
        print(f"¡Regalo de {nombre_invitado} por €{monto_pagado} guardado en Firestore!")

    return {"status": "success"}