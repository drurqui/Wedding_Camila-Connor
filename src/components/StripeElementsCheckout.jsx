import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Box, Button, CircularProgress, Typography, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';

export const StripePaymentForm = ({ onCancel, onSuccess, totalAmount, currency, colors }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}?pago=exito`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || t('common.error'));
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setLoading(false);
        if (onSuccess) {
          onSuccess(paymentIntent);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error al confirmar pago con Stripe Elements:', err);
      setErrorMessage(err.message || 'Error al procesar el pago.');
      setLoading(false);
    }
  };

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency || 'USD').toUpperCase(),
    maximumFractionDigits: 0,
  }).format(totalAmount);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ mb: 3, p: 2, bgcolor: colors?.sandLight || '#faf6ef', borderRadius: '0 12px 12px 0', border: `1px solid ${colors?.copperLight || '#d98d68'}` }}>
        <PaymentElement />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          sx={{ color: colors?.forestGreen || '#1e382b' }}
        >
          {t('wedding.honeymoon.modal.cancel') || 'Cancelar'}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || loading}
          sx={{
            bgcolor: colors?.terracotta || '#c7784f',
            color: '#fff',
            fontWeight: 600,
            px: 3,
            '&:hover': { bgcolor: colors?.copperDark || '#a15632' },
          }}
        >
          {loading ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            `${t('wedding.honeymoon.modal.payNow') || 'Pagar'} ${formattedAmount}`
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default StripePaymentForm;
