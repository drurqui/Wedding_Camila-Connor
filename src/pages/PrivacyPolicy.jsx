import React, { useEffect } from 'react';
import { 
  Box, Container, Typography, Card, Button, Divider, 
  Chip, Grid, Paper, IconButton, Tooltip 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EmailIcon from '@mui/icons-material/Email';
import PublicIcon from '@mui/icons-material/Public';
import LanguageIcon from '@mui/icons-material/Language';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const colors = {
  forestGreen: '#1e382b',
  forestDark: '#14261d',
  forestLight: '#2c4f3e',
  terracotta: '#c7784f',
  terracottaLight: '#e8a87c',
  sandBeige: '#f4f0e6',
  warmCream: '#fcfbf9',
  borderGold: 'rgba(199, 120, 79, 0.35)',
};

const contentByLang = {
  es: {
    badge: "Transparencia & Seguridad de Datos",
    title: "Política de Privacidad",
    subtitle: "Sitio Conmemorativo de Boda Camila & Connor",
    updated: "Última actualización: Septiembre de 2026",
    backBtn: "Volver a la Boda",
    jurisdictionsBadge: "Canadá (PIPEDA) • Estados Unidos (Leyes Federales y Estatales) • El Salvador",
    intro: "En el marco de la celebración de la boda de Camila Urquilla y Connor Shields, valoramos profundamente tu confianza y privacidad. Esta Política de Privacidad describe de manera transparente qué datos personales se recopilan a través de este sitio web, con qué finalidad, cómo se protegen y cuáles son tus derechos, en estricto cumplimiento con las normativas aplicables en Canadá (Personal Information Protection and Electronic Documents Act - PIPEDA), los Estados Unidos de América (directrices de la FTC y legislaciones de privacidad vigentes en todos los estados, tales como California, Nueva York, Florida, Texas, Virginia, entre otros) y la República de El Salvador.",
    sections: [
      {
        id: "datos-recopilados",
        title: "1. Información Personal que Recopilamos",
        body: "Recopilamos únicamente la información personal que nos proporcionas de forma voluntaria para fines organizativos y de cortesía:",
        items: [
          "Confirmación de Asistencia (RSVP): Nombre y apellido, dirección de correo electrónico, número de teléfono (opcional), lista de acompañantes o familiares directos autorizados, selecciones de menú de banquete y restricciones alimentarias o alergias.",
          "Aportes de Regalo y Luna de Miel: Nombre del donante (a menos que elijas aportar de forma anónima), correo electrónico para el envío del recibo digital y agradecimiento personalizado, importe aportado y moneda seleccionada (USD o CAD).",
          "Aportes Anónimos: Si seleccionas la opción 'Hacer este aporte de forma anónima', tu nombre no será registrado ni vinculado públicamente con la contribución. Tu correo electrónico, si decides ingresarlo, se empleará exclusivamente para enviarte el comprobante de Stripe y agradecimiento privado.",
          "Datos Financieros y de Tarjeta de Crédito: Nosotros NO almacenamos, procesamos ni tenemos acceso a números completos de tarjeta de crédito, fechas de expiración ni códigos de seguridad CVC. Todos los datos de pago son transmitidos y procesados directamente por la pasarela de pagos Stripe, Inc."
        ]
      },
      {
        id: "finalidad",
        title: "2. Finalidad del Uso de los Datos",
        body: "La información recolectada se utiliza exclusivamente para:",
        items: [
          "Gestionar la lista de invitados y garantizar el aforo de las sedes de ceremonia y recepción.",
          "Coordinar con los proveedores de banquete, hotelería y logística las restricciones alimenticias, transporte y asignación de lugares.",
          "Procesar los aportes de regalos de luna de miel y remitir el agradecimiento y comprobante correspondiente.",
          "Enviar comunicaciones y actualizaciones importantes sobre el itinerario del evento en Niagara-on-the-Lake y El Salvador."
        ]
      },
      {
        id: "terceros",
        title: "3. Proveedores de Servicios y Procesadores Externos",
        body: "Para operar de forma segura y confiable, nos apoyamos en proveedores de tecnología de primer nivel internacional que cumplen con rigurosos estándares de seguridad:",
        items: [
          "Stripe, Inc. (Pasarela de Pagos): Certificado como Proveedor de Servicios PCI-DSS Nivel 1 (el nivel más exigente en la industria financiera). Al realizar un pago con tarjeta, Stripe procesa tu información bancaria bajo sus propias políticas de privacidad y encriptación de grado bancario (AES-256).",
          "Google Cloud Platform & Firebase: Infraestructura de base de datos cifrada en reposo y tránsito, con alojamiento distribuido de alta disponibilidad.",
          "Servicio de Correo Seguro (SMTP / EasyMail): Utilizado de manera automatizada para emitir recibos y notas de cortesía directamente a los invitados que proporcionaron su dirección electrónica."
        ]
      },
      {
        id: "no-venta",
        title: "4. No Comercialización ni Venta de Datos",
        body: "Bajo ninguna circunstancia vendemos, alquilamos, cedemos ni comercializamos tus datos personales a anunciantes, corredores de datos ni a terceros ajenos a la organización privada de nuestra boda."
      },
      {
        id: "seguridad",
        title: "5. Seguridad y Retención de la Información",
        body: "Implementamos conexiones encriptadas mediante protocolo SSL/TLS (HTTPS) en todo el sitio web. Las bases de datos en Firestore cuentan con reglas de seguridad restrictivas accesibles exclusivamente por los organizadores del evento. Los datos personales se conservarán únicamente durante el período necesario para concluir las celebraciones y los compromisos de confirmación de los novios, tras lo cual podrán ser eliminados o archivados de forma privada."
      },
      {
        id: "regulaciones",
        title: "6. Cumplimiento Internacional Específico",
        items: [
          "Canadá (PIPEDA): Se garantiza el principio de consentimiento informado y voluntario. Puedes consultar en cualquier momento la información suministrada o solicitar su modificación.",
          "Estados Unidos (Leyes Federales y Estatales de Privacidad): Este sitio respeta la privacidad de los invitados en todos los estados y territorios de EE. UU. (incluyendo California, Nueva York, Florida, Texas, Virginia, entre otros). No rastreamos usuarios entre sitios web de terceros ('Do Not Track'), no vendemos datos de consumidores ni realizamos perfilado comercial.",
          "El Salvador: En apego a las disposiciones de protección de datos personales y comercio electrónico, los datos se recaban con fines legítimos expresos y bajo estrictos deberes de confidencialidad."
        ]
      },
      {
        id: "derechos-contacto",
        title: "7. Tus Derechos y Contacto",
        body: "Puedes solicitar en cualquier momento la consulta, corrección o eliminación de tu registro de asistencia o detalles de aportes escribiendo a nuestro correo oficial:",
        email: "rsvp@shieldsurquilla.com"
      }
    ]
  },
  en: {
    badge: "Transparency & Data Security",
    title: "Privacy Policy",
    subtitle: "Camila & Connor Wedding Memorial Website",
    updated: "Last updated: September 2026",
    backBtn: "Back to Wedding",
    jurisdictionsBadge: "Canada (PIPEDA) • United States (Federal & State Laws) • El Salvador",
    intro: "In celebrating the wedding of Camila Urquilla and Connor Shields, your privacy and trust are of paramount importance to us. This Privacy Policy transparently outlines what personal data is collected through this website, how it is used and protected, and what rights you retain, in compliance with applicable standards in Canada (PIPEDA), the United States of America (FTC consumer protection standards and comprehensive state privacy laws across California, New York, Florida, Texas, Virginia, and all US jurisdictions), and the Republic of El Salvador.",
    sections: [
      {
        id: "datos-recopilados",
        title: "1. Personal Information We Collect",
        body: "We only collect personal information that you voluntarily provide to us for planning and event coordination purposes:",
        items: [
          "RSVP / Attendance Confirmation: First and last name, email address, optional phone number, authorized accompanying family members/guests, banquet meal selections, and dietary restrictions or allergies.",
          "Honeymoon Registry Contributions: Donor's name (unless you choose to give anonymously), email address for digital receipts and wedding thank-you correspondence, contribution amount, and chosen currency (USD or CAD).",
          "Anonymous Contributions: If you select 'Make this contribution anonymously', your name will neither be logged nor displayed publicly. Your email, if provided, is strictly used to send your Stripe transaction receipt and a private thank-you.",
          "Credit Card & Financial Details: We do NOT collect, store, or have access to full credit card numbers, expiration dates, or CVC security codes. All payment transactions are processed directly by Stripe, Inc."
        ]
      },
      {
        id: "finalidad",
        title: "2. How We Use Your Information",
        body: "Your information is used strictly to:",
        items: [
          "Manage guest attendance and ensure venue capacity limitations are respected.",
          "Coordinate dietary restrictions, transportation, and seating arrangements with catering and venue teams.",
          "Process voluntary honeymoon gifts and dispatch thank-you notes and receipts.",
          "Send essential logistical updates regarding events in Niagara-on-the-Lake and El Salvador."
        ]
      },
      {
        id: "terceros",
        title: "3. Third-Party Service Providers and Processors",
        body: "We rely on world-class service providers to ensure the highest standards of security:",
        items: [
          "Stripe, Inc. (Payment Processing): Certified PCI-DSS Level 1 Service Provider. Credit card information is securely transmitted directly to Stripe using bank-level AES-256 encryption.",
          "Google Cloud Platform & Firebase: Cloud-hosted database encrypted in transit and at rest, secured by strict access rules.",
          "Secure SMTP / EasyMail Service: Used exclusively to deliver automated RSVP confirmations and wedding gift receipts."
        ]
      },
      {
        id: "no-venta",
        title: "4. No Sale or Commercial Sharing of Data",
        body: "We do not sell, rent, trade, or share your personal data with advertisers, commercial third parties, or data brokers under any circumstances."
      },
      {
        id: "seguridad",
        title: "5. Security and Data Retention",
        body: "Our website enforces HTTPS/TLS encryption across all interactions. Firebase data storage is shielded behind secure authorization rules. Personal records are retained solely for the timeline required to plan and wrap up wedding celebrations."
      },
      {
        id: "regulaciones",
        title: "6. International Regulatory Compliance",
        items: [
          "Canada (PIPEDA): Informed, voluntary consent is respected. You may inspect or modify your submitted details at any time.",
          "United States (Federal & State Privacy Standards): We protect guest privacy across all 50 states and territories. We do not sell or monetize personal information, we honor browser 'Do Not Track' signals, and we afford all US guests the right to inspect, update, or remove their data.",
          "El Salvador: All personal and transactional details are collected with explicit consent and handled under confidentiality."
        ]
      },
      {
        id: "derechos-contacto",
        title: "7. Your Rights and Contact Information",
        body: "You can request to view, rectify, or delete your attendance information or contribution records at any time by reaching out to us at:",
        email: "rsvp@shieldsurquilla.com"
      }
    ]
  },
  fr: {
    badge: "Transparence & Sécurité des Données",
    title: "Politique de Confidentialité",
    subtitle: "Site commémoratif de mariage de Camila & Connor",
    updated: "Dernière mise à jour : Septembre 2026",
    backBtn: "Retour au Mariage",
    jurisdictionsBadge: "Canada (LPRPDE / PIPEDA) • États-Unis (Lois Fédérales et d'États) • El Salvador",
    intro: "Dans le cadre de la célébration du mariage de Camila Urquilla et Connor Shields, nous accordons une grande importance à votre vie privée. Cette politique de confidentialité explique en toute transparence quelles informations personnelles sont recueillies, comment elles sont protégées et vos droits en vertu des lois canadiennes (LPRPDE/PIPEDA), américaines (normes fédérales FTC et législations de confidentialité de l'ensemble des États américains) et salvadoriennes.",
    sections: [
      {
        id: "datos-recopilados",
        title: "1. Renseignements Personnels Recueillis",
        body: "Nous recueillons uniquement les informations que vous nous transmettez volontairement pour des motifs d'organisation :",
        items: [
          "Confirmation de Présence (RSVP) : Prénom, nom, adresse courriel, numéro de téléphone (facultatif), accompagnateurs autorisés, choix de repas et restrictions alimentaires.",
          "Cadeaux et Lune de Miel : Nom du donateur (sauf si contribution anonyme), courriel pour le reçu et les remerciements, montant et devise (CAD ou USD).",
          "Dons Anonymes : Si vous choisissez l'option anonyme, votre nom ne figurera sur aucun registre public. Votre courriel sert uniquement à vous faire parvenir le reçu sécurisé de Stripe.",
          "Données Bancaires et Cartes : Nous ne stockons jamais vos numéros complets de carte de crédit ni code CVC. Tous les paiements sont pris en charge directement par Stripe, Inc."
        ]
      },
      {
        id: "finalidad",
        title: "2. Utilisation des Renseignements",
        body: "Les renseignements sont strictement utilisés pour coordonner la logistique du mariage, les régimes alimentaires, les transferts et la gestion des cadeaux.",
        items: []
      },
      {
        id: "terceros",
        title: "3. Prestataires et Sous-Traitants",
        body: "Nous faisons appel à des prestataires de confiance : Stripe (conforme PCI-DSS Niveau 1 pour les paiements en ligne), Google Cloud / Firebase (hébergement sécurisé et chiffré) et EasyMail (envois de courriels d'information).",
        items: []
      },
      {
        id: "no-venta",
        title: "4. Aucune Vente de Données",
        body: "Vos renseignements ne seront jamais vendus, loués ou partagés avec des tiers à des fins commerciales ou publicitaires."
      },
      {
        id: "regulaciones",
        title: "5. Conformité Internationale (Canada, États-Unis, El Salvador)",
        body: "Nous garantissons le respect des normes fédérales et étatiques américaines (protection contre la vente de données et prise en compte des requêtes de suppression), canadiennes (consentement éclairé sous la LPRPDE) et salvadoriennes.",
        items: []
      },
      {
        id: "derechos-contacto",
        title: "6. Vos Droits et Contact",
        body: "Vous pouvez à tout moment demander la modification ou suppression de vos données en écrivant à :",
        email: "rsvp@shieldsurquilla.com"
      }
    ]
  }
};

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'es').substring(0, 2);
  const lang = contentByLang[currentLang] || contentByLang.es;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Box sx={{ bgcolor: colors.forestDark, minHeight: '100vh', py: { xs: 4, md: 8 }, color: colors.sandBeige }}>
      <Container maxWidth="md">
        
        {/* BARRA SUPERIOR DE ACCIONES */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/boda')}
            sx={{
              color: colors.sandBeige,
              borderColor: colors.terracotta,
              borderRadius: '0 12px 12px 0',
              border: `1px solid ${colors.terracotta}`,
              px: 2.5,
              py: 0.8,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(199, 120, 79, 0.2)',
                borderColor: colors.terracottaLight,
              }
            }}
          >
            {lang.backBtn}
          </Button>

          {/* Selector de idioma */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon sx={{ color: colors.terracottaLight, fontSize: 20 }} />
            {['es', 'en', 'fr'].map((l) => (
              <Chip
                key={l}
                label={l.toUpperCase()}
                size="small"
                onClick={() => changeLanguage(l)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: currentLang === l ? 700 : 500,
                  bgcolor: currentLang === l ? colors.terracotta : 'rgba(255, 255, 255, 0.08)',
                  color: currentLang === l ? '#ffffff' : colors.sandBeige,
                  border: `1px solid ${currentLang === l ? colors.terracottaLight : 'transparent'}`,
                  borderRadius: '0 8px 8px 0',
                  '&:hover': {
                    bgcolor: currentLang === l ? colors.terracottaLight : 'rgba(255, 255, 255, 0.16)'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* ENCABEZADO PRINCIPAL */}
        <Card
          sx={{
            bgcolor: colors.forestGreen,
            borderRadius: '0 24px 24px 0',
            border: `1px solid ${colors.borderGold}`,
            p: { xs: 3, md: 5 },
            mb: 4,
            boxShadow: '0 16px 36px rgba(0,0,0,0.35)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <SecurityIcon sx={{ color: colors.terracottaLight, fontSize: 28 }} />
            <Typography variant="overline" sx={{ letterSpacing: 2, color: colors.terracottaLight, fontWeight: 700 }}>
              {lang.badge}
            </Typography>
          </Box>

          <Typography 
            variant="h2" 
            sx={{ 
              fontFamily: '"Playfair Display", Georgia, serif', 
              fontSize: { xs: '2.2rem', md: '3.2rem' },
              color: '#ffffff',
              mb: 1
            }}
          >
            {lang.title}
          </Typography>

          <Typography variant="subtitle1" sx={{ color: colors.sandBeige, opacity: 0.9, mb: 2, fontStyle: 'italic' }}>
            {lang.subtitle}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mt: 2 }}>
            <Chip 
              icon={<PublicIcon sx={{ color: '#ffffff !important' }} />}
              label={lang.jurisdictionsBadge} 
              sx={{ 
                bgcolor: 'rgba(199, 120, 79, 0.25)', 
                color: '#ffffff', 
                border: `1px solid ${colors.terracotta}`,
                borderRadius: '0 8px 8px 0',
                fontSize: '0.8rem'
              }} 
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', ml: 'auto' }}>
              {lang.updated}
            </Typography>
          </Box>

          <Divider sx={{ my: 3, borderColor: 'rgba(199, 120, 79, 0.3)' }} />

          <Typography variant="body1" sx={{ lineHeight: 1.8, color: colors.sandBeige, fontSize: '0.98rem' }}>
            {lang.intro}
          </Typography>
        </Card>

        {/* CONTENIDO DE LAS SECCIONES */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {lang.sections.map((sec) => (
            <Card
              key={sec.id}
              sx={{
                bgcolor: 'rgba(30, 56, 43, 0.75)',
                backdropFilter: 'blur(8px)',
                borderRadius: '0 18px 18px 0',
                border: `1px solid rgba(199, 120, 79, 0.25)`,
                p: { xs: 3, md: 4 },
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  fontFamily: '"Playfair Display", Georgia, serif', 
                  color: colors.terracottaLight,
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', md: '1.45rem' },
                  mb: 2
                }}
              >
                {sec.title}
              </Typography>

              {sec.body && (
                <Typography variant="body1" sx={{ color: colors.sandBeige, lineHeight: 1.7, mb: sec.items?.length ? 2 : 0 }}>
                  {sec.body}
                </Typography>
              )}

              {sec.items && sec.items.length > 0 && (
                <Box component="ul" sx={{ pl: 3, m: 0, display: 'flex', flexDirection: 'column', gap: 1.3 }}>
                  {sec.items.map((item, idx) => (
                    <Box 
                      component="li" 
                      key={idx} 
                      sx={{ 
                        color: colors.sandBeige, 
                        lineHeight: 1.65,
                        fontSize: '0.95rem'
                      }}
                    >
                      {item}
                    </Box>
                  ))}
                </Box>
              )}

              {sec.email && (
                <Box sx={{ mt: 2, display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.25)', px: 2, py: 1, borderRadius: '0 8px 8px 0', border: `1px solid ${colors.terracotta}` }}>
                  <EmailIcon sx={{ color: colors.terracottaLight, fontSize: 18 }} />
                  <Typography 
                    component="a" 
                    href={`mailto:${sec.email}`} 
                    sx={{ color: '#ffffff', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  >
                    {sec.email}
                  </Typography>
                </Box>
              )}
            </Card>
          ))}
        </Box>

        {/* PIE DE PÁGINA */}
        <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid rgba(199, 120, 79, 0.25)', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, fontSize: '0.8rem' }}>
            CAMILA & CONNOR • EL SALVADOR & NIAGARA-ON-THE-LAKE
          </Typography>
        </Box>

      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
