
import React from 'react';
import { PaymentMethod } from '@/types/checkout';
import RadioOption from './RadioOption';
import { RadioGroup } from '@/components/ui/radio-group';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect
}) => {
  return (
    <div className="mb-4">
      <p className="text-sm text-muted-foreground mb-2">Selecione o método de pagamento:</p>
      
      <RadioGroup value={selectedMethod} onValueChange={(value: PaymentMethod) => onSelect(value)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <RadioOption
            id="payment-method-pix"
            value="pix"
            label="PIX"
            description="Aprovação imediata"
            checked={selectedMethod === 'pix'}
            onChange={() => onSelect('pix')}
          />
          
          <RadioOption
            id="payment-method-credit-card"
            value="creditCard"
            label="Cartão de crédito"
            description="Aprovação em segundos"
            checked={selectedMethod === 'creditCard'}
            onChange={() => onSelect('creditCard')}
          />
        </div>
      </RadioGroup>
    </div>
  );
};
