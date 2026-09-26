import React, { useEffect } from 'react';
import { 
  Box, Container, Typography, Card, Button, Divider, 
  Chip, Grid, Paper, IconButton, Tooltip 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GavelIcon from '@mui/icons-material/Gavel';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
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
    badge: "Condiciones de Uso & Transacciones",
    title: "Términos y Condiciones de Uso",
    subtitle: "Sitio Web y Registro de Luna de Miel • Camila & Connor",
    updated: "Última actualización: Septiembre de 2026",
    backBtn: "Volver a la Boda",
    jurisdictionsBadge: "Canadá • Estados Unidos (Leyes Federales y Estatales) • El Salvador",
    intro: "Bienvenido al sitio web oficial de la celebración de matrimonio de Camila Urquilla y Connor Shields. Al acceder o utilizar este sitio web, confirmar tu asistencia o participar en nuestro registro de regalos y aportes de luna de miel, aceptas los presentes Términos y Condiciones.",
    sections: [
      {
        id: "naturaleza-sitio",
        title: "1. Naturaleza Privada y Social del Sitio Web",
        body: "Este sitio web es una plataforma privada, conmemorativa y sin fines de lucro creada con el único propósito de compartir detalles logísticos, facilitar la confirmación de asistencia (RSVP) y coordinar muestras de cariño y regalos entre los contrayentes, sus familias y sus invitados.",
        items: []
      },
      {
        id: "aportes-regalos",
        title: "2. Aportes de Luna de Miel y Regalos Nupciales (Stripe)",
        body: "Los aportes monetarios canalizados a través de este sitio web se rigen por las siguientes condiciones:",
        items: [
          "Carácter de Regalo Voluntario: Todas las contribuciones realizadas en la sección de 'Luna de Miel' (Honeymoon Fund) constituyen obsequios nupciales a título gratuito y de mera liberalidad en homenaje a los novios. No constituyen compraventa comercial de bienes físicos ni prestación de servicios mercantiles.",
          "Opciones de Moneda: Los aportes pueden efectuarse en Dólares Estadounidenses (USD) o Dólares Canadienses (CAD), según la preferencia del invitado.",
          "Procesamiento Seguro: Los pagos se procesan directamente mediante Stripe, Inc., un proveedor certificado con el estándar de seguridad más elevado del sector financiero (PCI-DSS Nivel 1). Este sitio no almacena ni manipula datos de tarjetas de crédito o débito.",
          "Aportes Anónimos: Los invitados tienen la facultad de marcar su aporte como 'anónimo'. En tal caso, el nombre no se divulgará públicamente ni aparecerá asociado al regalo. Si se proporciona un correo electrónico, este solo se utilizará para el envío del recibo digital de Stripe y una nota privada de agradecimiento."
        ]
      },
      {
        id: "politica-reembolsos",
        title: "3. Política de Reembolsos y Errores de Transacción",
        body: "Dada la naturaleza de obsequio personal y voluntario de las contribuciones, estas se consideran definitivas tras su confirmación. No obstante, velando siempre por la tranquilidad de nuestros seres queridos:",
        items: [
          "Si se genera un cobro duplicado accidental, un error involuntario en el monto digitado o cualquier incidencia técnica atribuible al sistema, el donante podrá solicitar la revisión y reversión de la transacción dentro de los 14 días naturales posteriores al cargo.",
          "Para gestionar la devolución, basta con escribir a rsvp@shieldsurquilla.com adjuntando el comprobante o referencia de pago emitida por Stripe. Coordinaremos el reembolso directo al mismo método de pago original sin recargo alguno."
        ]
      },
      {
        id: "confirmacion-rsvp",
        title: "4. Confirmación de Asistencia (RSVP)",
        body: "La confirmación de asistencia en línea representa un compromiso logístico para la reserva de alimentos, bebidas, transporte y acomodación de los invitados. Rogamos a los asistentes comunicar cualquier cambio imprevisto en sus planes con la mayor anticipación posible a través de los canales de contacto oficiales.",
        items: []
      },
      {
        id: "propiedad-intelectual",
        title: "5. Fotografías y Propiedad Intelectual",
        body: "Todas las fotografías, retratos familiares, diseños gráficos, cronogramas y textos alojados en esta plataforma pertenecen a Camila & Connor y a sus fotógrafos autorizados. Queda prohibida su reproducción comercial o uso no autorizado en plataformas de terceros.",
        items: []
      },
      {
        id: "enlaces-externos",
        title: "6. Enlaces a Servicios de Terceros",
        body: "Este portal puede incluir enlaces a servicios externos de utilidad (p. ej. plataformas hoteleras, servicios de mapas satelitales o mesa de bodas en Amazon). Dichos servicios operan bajo sus propios términos y políticas ajenas a este sitio.",
        items: []
      },
      {
        id: "contacto",
        title: "7. Contacto y Consultas",
        body: "Para cualquier aclaración o asistencia relacionada con el sitio, confirmaciones o pagos:",
        email: "rsvp@shieldsurquilla.com"
      }
    ]
  },
  en: {
    badge: "Terms of Use & Transactions",
    title: "Terms and Conditions of Use",
    subtitle: "Camila & Connor Wedding Memorial Website & Honeymoon Registry",
    updated: "Last updated: September 2026",
    backBtn: "Back to Wedding",
    jurisdictionsBadge: "Canada • United States (Federal & State Laws) • El Salvador",
    intro: "Welcome to the official wedding website of Camila Urquilla and Connor Shields. By accessing or browsing this website, submitting your RSVP, or contributing to our honeymoon registry, you agree to these Terms and Conditions.",
    sections: [
      {
        id: "naturaleza-sitio",
        title: "1. Private and Social Nature of the Website",
        body: "This website is a private, celebratory, and non-commercial platform intended exclusively to coordinate guest attendance, logistics, travel information, and wedding gifting among the couple, their families, and invited guests.",
        items: []
      },
      {
        id: "aportes-regalos",
        title: "2. Honeymoon Registry Contributions (Stripe)",
        body: "Monetary contributions facilitated through this website are governed by the following terms:",
        items: [
          "Voluntary Wedding Gifts: All monetary contributions made through the Honeymoon registry constitute voluntary personal gifts celebrating the marriage of the couple. They do not represent commercial purchases of retail goods or taxable commercial services.",
          "Supported Currencies: Guests may submit contributions in US Dollars (USD) or Canadian Dollars (CAD).",
          "Secure Processing: Payments are processed directly via Stripe, Inc., certified under the highest financial security benchmark (PCI-DSS Level 1). This website never accesses, stores, or handles full credit card details or CVC codes.",
          "Anonymous Gifting: Guests may designate any contribution as anonymous. If so selected, the donor's name will not be logged or publicly displayed. Any email entered is used strictly to provide the Stripe transaction receipt and a private thank-you message."
        ]
      },
      {
        id: "politica-reembolsos",
        title: "3. Refund and Transaction Error Policy",
        body: "Given that contributions represent voluntary celebratory gifts, all gifts are typically deemed final. However, in the spirit of fairness and transparency:",
        items: [
          "If an inadvertent duplicate charge, typographical amount error, or technical malfunction occurs, the contributor may request a correction or reversal within 14 calendar days of the transaction.",
          "To request assistance or a refund, please contact rsvp@shieldsurquilla.com with your Stripe receipt. We will process a full reversal directly to the original payment method without processing fees."
        ]
      },
      {
        id: "confirmacion-rsvp",
        title: "4. RSVP and Attendance Coordination",
        body: "Submitting an RSVP represents an important commitment for venue capacity, seating, and catering preparations. Guests are kindly requested to update their attendance promptly should their travel plans change.",
        items: []
      },
      {
        id: "propiedad-intelectual",
        title: "5. Photography and Intellectual Property",
        body: "All photography, portraits, original stories, and website styling belong to Camila & Connor and their commissioned photographers. Commercial reproduction or unauthorized redistribution is strictly prohibited.",
        items: []
      },
      {
        id: "enlaces-externos",
        title: "6. External Third-Party Links",
        body: "This website may contain links to helpful third-party platforms (e.g., hotels, mapping services, airline schedules, and Amazon Wedding Registry). We are not responsible for the content or service terms of those external providers.",
        items: []
      },
      {
        id: "contacto",
        title: "7. Contact Information",
        body: "For any questions regarding website usage, RSVP details, or contribution receipts, please write to:",
        email: "rsvp@shieldsurquilla.com"
      }
    ]
  },
  fr: {
    badge: "Conditions d'Utilisation",
    title: "Conditions Générales d'Utilisation",
    subtitle: "Site officiel de mariage et liste de lune de miel • Camila & Connor",
    updated: "Dernière mise à jour : Septembre 2026",
    backBtn: "Retour au Mariage",
    jurisdictionsBadge: "Canada • États-Unis (Lois Fédérales et d'États) • El Salvador",
    intro: "Bienvenue sur le site commémoratif du mariage de Camila Urquilla et Connor Shields. En accédant à ce site, en confirmant votre présence (RSVP) ou en participant à notre liste de lune de miel, vous acceptez les présentes conditions.",
    sections: [
      {
        id: "naturaleza-sitio",
        title: "1. Nature Privée du Site",
        body: "Ce site web est un espace personnel et privé dédié au partage d'informations logistiques et à la célébration du mariage entre les mariés, leurs familles et leurs invités.",
        items: []
      },
      {
        id: "aportes-regalos",
        title: "2. Cadeaux de Lune de Miel (Stripe)",
        body: "Les contributions financières constituent des cadeaux personnels et bénévoles et ne constituent en aucun cas un achat commercial de biens ou de services.",
        items: [
          "Paiements Sécurisés : Gérés directement par Stripe, Inc. (conforme à la norme bancaire PCI-DSS Niveau 1). Aucune information de carte n'est enregistrée sur nos serveurs.",
          "Contributions Anonymes : Vous pouvez choisir d'effectuer votre don de façon anonyme. Votre nom ne sera ni enregistré ni divulgué.",
          "Devises : Les contributions peuvent être réglées en dollars canadiens (CAD) ou en dollars américains (USD)."
        ]
      },
      {
        id: "politica-reembolsos",
        title: "3. Remboursements et Erreurs",
        body: "En cas de double facturation accidentelle ou d'erreur sur le montant, contactez rsvp@shieldsurquilla.com dans les 14 jours suivant la transaction pour un remboursement intégral sur la carte d'origine.",
        items: []
      },
      {
        id: "contacto",
        title: "4. Contact",
        body: "Pour toute demande, écrivez-nous à :",
        email: "rsvp@shieldsurquilla.com"
      }
    ]
  }
};

const TermsOfUse = () => {
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
            <GavelIcon sx={{ color: colors.terracottaLight, fontSize: 28 }} />
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

export default TermsOfUse;
