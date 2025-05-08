
import React, { useRef, useState, useEffect } from 'react';
import { CheckoutCustomization, CustomerData, PaymentMethod, Product, AddressData, BumpProduct, UTMData } from '@/types/checkout';
import { PersonalInfoSection } from './PersonalInfoSection';
import { TestimonialSection } from './TestimonialSection';
import { PaymentMethodSection } from './payment-methods/PaymentMethodSection';
import { OrderSummary } from './OrderSummary';
import { AddressForm } from './address/AddressForm';
import { useShippingMessage } from './address/useShippingMessage';
import { RandomVisitorsMessage } from './RandomVisitorsMessage';
import { OrderBump } from './OrderBump'; 

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
  utmParams?: UTMData;
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
  onAddressSubmit,
  utmParams
}) => {
  const customerFormRef = useRef<HTMLFormElement>(null);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [showFreeShipping, setShowFreeShipping] = useState(false);
  const [additionalTotal, setAdditionalTotal] = useState(0);
  
  // Mapear order_bumps do produto para o formato BumpProduct
  const [bumpProducts, setBumpProducts] = useState<BumpProduct[]>([]);
  
  // Carrega os order bumps do produto
  useEffect(() => {
    if (product && product.order_bumps && product.order_bumps.length > 0) {
      console.log("Order bumps presentes no produto:", product.order_bumps);
      
      // Mapear order bumps para o formato esperado pelo componente OrderBump
      const activeBumps = product.order_bumps
        .filter(bump => bump.active !== false)
        .map(bump => ({
          id: bump.id,
          name: bump.name,
          description: bump.description,
          price: bump.price,
          imageUrl: bump.imageUrl || undefined
        }));
      
      console.log("Order bumps formatados:", activeBumps);
      setBumpProducts(activeBumps);
    } else {
      console.log("Nenhum order bump encontrado no produto");
      setBumpProducts([]);
    }
  }, [product]);
  
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
    console.log("Order bumps selecionados:", selectedProducts);
    console.log("Valor adicional:", total);
    setAdditionalTotal(total);
  };
  
  // Combine product price with additional items
  const totalPrice = product.price + additionalTotal;
  
  // Modified payment submit to include additional total and UTM data
  const handlePaymentSubmit = (data?: any) => {
    // Include additional total and UTM data in payment data
    const paymentData = {
      ...(data || {}),
      additionalTotal,
      totalPrice,
      utms: utmParams
    };
    
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
      
      {/* Add OrderBump component - exibe se houver products */}
      {bumpProducts && bumpProducts.length > 0 && (
        <div className="my-6">
          <h3 className="text-lg mb-3 font-medium">Ofertas Especiais:</h3>
          <OrderBump 
            products={bumpProducts} 
            onChange={handleAdditionalTotal} 
          />
        </div>
      )}
      
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
