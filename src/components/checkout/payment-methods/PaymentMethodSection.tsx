
import React, { useRef, useEffect } from 'react';
import { PaymentMethod } from '@/types/checkout';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentMethodForms } from './PaymentMethodForms';
import { getStoredUtmParams } from '@/hooks/useUtmParams';

interface PaymentMethodSectionProps {
  id?: string;
  paymentMethod: PaymentMethod;
  customerFormRef: React.RefObject<HTMLFormElement>;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onSubmit: (data?: any) => void;
  onCustomerDataSubmit: (customerData: any) => void;
  isSubmitting: boolean;
  headingColor: string;
  buttonColor: string;
  buttonText: string;
  productPrice?: number;
}

export const PaymentMethodSection: React.FC<PaymentMethodSectionProps> = ({
  id,
  paymentMethod,
  customerFormRef,
  onPaymentMethodChange,
  onSubmit,
  onCustomerDataSubmit,
  isSubmitting,
  headingColor,
  buttonColor,
  buttonText,
  productPrice = 0
}) => {
  // Get stored UTM parameters
  const utmParamsRef = useRef(getStoredUtmParams());
  
  // Submit handler with UTM parameters
  const handleSubmit = (data?: any) => {
    // Add UTM parameters to the payment data
    const paymentDataWithUtm = data ? {
      ...data,
      utms: utmParamsRef.current
    } : { utms: utmParamsRef.current };
    
    onSubmit(paymentDataWithUtm);
  };
  
  return (
    <div id={id} className="bg-white border border-[#E4E4E7] rounded-lg p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.02)] mb-5 text-[#111]">
      <h2 
        className="text-xl font-semibold mb-4" 
        style={{ color: headingColor }}
      >
        Forma de pagamento
      </h2>
      
      <PaymentMethodSelector
        selectedMethod={paymentMethod}
        onSelect={onPaymentMethodChange}
      />
      
      <div className="mt-5">
        <PaymentMethodForms 
          paymentMethod={paymentMethod}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          buttonColor={buttonColor}
          buttonText={buttonText}
          productPrice={productPrice}
          hasValidCustomerData={!!customerFormRef.current}
        />
      </div>
    </div>
  );
};
