import React, { useRef, useState } from 'react';
import { CheckoutCustomization, CustomerData, PaymentMethod, Product, AddressData } from '@/types/checkout';
import { PersonalInfoSection } from './PersonalInfoSection';
import { TestimonialSection } from './TestimonialSection';
import { PaymentMethodSection } from './payment-methods/PaymentMethodSection';
import { OrderSummary } from './OrderSummary';
import { AddressForm } from './address/AddressForm';
import { useShippingMessage } from './address/useShippingMessage';
import { RandomVisitorsMessage } from './RandomVisitorsMessage';
import { OrderBump } from './OrderBump'; 
import { BumpProduct } from './OrderBump/types';

interface CheckoutContentProps {
  product: Product;
  customerData: CustomerData | null;
  paymentMethod: PaymentMethod;
  isSubmitting: boolean;
  customization: CheckoutCustomization;
  onCustomerSubmit: (customerData: CustomerData) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onPaymentSubmit: (data?: any) => void;
  onAddressSubmit?: (addressData: AddressData) => void;
}

export const CheckoutContent: React.FC<CheckoutContentProps> = ({
  product,
  customerData,
  paymentMethod,
  isSubmitting,
  customization,
  onCustomerSubmit,
  onPaymentMethodChange,
  onPaymentSubmit,
  onAddressSubmit
}) => {
  const customerFormRef = useRef<HTMLFormElement>(null);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [showFreeShipping, setShowFreeShipping] = useState(false);
  const [additionalTotal, setAdditionalTotal] = useState(0);
  
  // Exemplo de produtos para OrderBump
  const bumpProducts: BumpProduct[] = [
    {
      id: 'bump1',
      name: 'Garantia Estendida',
      description: 'Estenda sua garantia por mais 12 meses',
      price: product.price * 0.15, // 15% do valor do produto principal
      imageUrl: 'https://placehold.co/100x60/6E59A5/FFFFFF.png?text=Garantia'
    },
    {
      id: 'bump2',
      name: 'Entrega Expressa',
      description: 'Receba em até 3 dias úteis',
      price: 19.90,
      imageUrl: 'https://placehold.co/100x60/6E59A5/FFFFFF.png?text=Express'
    }
  ];
  
  // Determine if product is physical based on the product type
  const isPhysicalProduct = product.type === 'physical';
  
  const handleAddressSubmit = (data: AddressData) => {
    setAddressData(data);
    if (data.cep && data.number) {
      setShowFreeShipping(true);
    }
    if (onAddressSubmit) {
      onAddressSubmit(data);
    }
  };
  
  // Handle additional total from OrderBump
  const handleAdditionalTotal = (selectedProducts: BumpProduct[], total: number) => {
    setAdditionalTotal(total);
  };
  
  // Combine product price with additional items
  const totalPrice = product.price + additionalTotal;
  
  // Modified payment submit to include additional total
  const handlePaymentSubmit = (data?: any) => {
    // Include additional total in payment data
    const paymentData = data ? {
      ...data,
      additionalTotal,
      totalPrice
    } : undefined;
    
    onPaymentSubmit(paymentData);
  };

  return (
    <div className="space-y-4">
      {/* Add the Random Visitors Message component just below the banner */}
      <RandomVisitorsMessage min={1} max={20} />
      
      <PersonalInfoSection 
        onSubmit={onCustomerSubmit}
        headingColor={customization.headingColor}
        formRef={customerFormRef}
      />
      
      {/* Show testimonials only for digital products */}
      {!isPhysicalProduct && (
        <TestimonialSection
          headingColor={customization.headingColor}
        />
      )}
      
      {/* Show address form only for physical products */}
      {isPhysicalProduct && (
        <AddressForm
          onAddressSubmit={handleAddressSubmit}
          headingColor={customization.headingColor}
        />
      )}
      
      {/* Add OrderBump component */}
      <OrderBump 
        products={bumpProducts} 
        onChange={handleAdditionalTotal} 
      />
      
      <PaymentMethodSection
        id="payment-section"
        paymentMethod={paymentMethod}
        customerFormRef={customerFormRef}
        onPaymentMethodChange={onPaymentMethodChange}
        onSubmit={handlePaymentSubmit}
        onCustomerDataSubmit={onCustomerSubmit}
        isSubmitting={isSubmitting}
        headingColor={customization.headingColor}
        buttonColor={customization.buttonColor}
        buttonText={customization.buttonText}
        productPrice={totalPrice} // Use updated total price
      />
      
      <OrderSummary 
        product={product}
        isDigitalProduct={!isPhysicalProduct}
        showFreeShipping={showFreeShipping}
        additionalTotal={additionalTotal}
      />
    </div>
  );
};
