
import React from 'react';
import { Product, BumpProduct } from '@/types/checkout';
import { Shield, Truck, Package, ShoppingBag } from 'lucide-react';
import { SectionTitle } from './SectionTitle';
import { OrderBump } from './OrderBump';

interface OrderSummaryProps {
  product: Product;
  isDigitalProduct?: boolean;
  showFreeShipping?: boolean;
  additionalTotal?: number;
  orderBumpProducts?: BumpProduct[];
  onOrderBumpChange?: (selectedProducts: BumpProduct[], total: number) => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  product, 
  isDigitalProduct = true,
  showFreeShipping = false,
  additionalTotal = 0,
  orderBumpProducts = [],
  onOrderBumpChange
}) => {
  const totalPrice = product.price + additionalTotal;
  
  return (
    <section id="order-summary-section" className="mb-5">
      <SectionTitle 
        number={3} 
        title="Resumo do pedido" 
        numberBadgeColor="#16a34a"
      />
      
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.02)] text-[#111]">
        <div className="flex items-center mb-4">
          <ShoppingBag className="mr-2 text-gray-600" size={20} />
          <h3 className="font-bold text-sm">Sua Compra</h3>
        </div>
        
        <div className="flex items-center py-3 border-b border-[#E0E0E0]">
          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded p-2 mr-3 flex items-center justify-center">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 rounded flex items-center justify-center text-xs text-gray-600">
                Imagem
              </div>
            )}
          </div>
          
          <div className="flex-grow">
            <h4 className="font-medium text-sm">{product.name}</h4>
            <p className="text-xs text-gray-600">1 item</p>
          </div>
          
          <div className="flex-shrink-0 font-medium">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
          </div>
        </div>
        
        {/* More elegant free shipping message for physical products */}
        {!isDigitalProduct && showFreeShipping && (
          <div className="flex justify-between items-center text-sm text-green-700 font-medium bg-green-50 px-2 py-1.5 rounded mt-3 mb-3">
            <span className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-green-600" />
              Entrega Grátis para este Endereço
            </span>
            <span className="text-green-600">Grátis</span>
          </div>
        )}
        
        {/* OrderBump component - position at the end before totals */}
        {orderBumpProducts && orderBumpProducts.length > 0 && onOrderBumpChange && (
          <div className="mt-4 mb-4">
            <OrderBump 
              products={orderBumpProducts} 
              onChange={onOrderBumpChange}
            />
          </div>
        )}
        
        <div className="pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</span>
          </div>
          
          {/* Display additional total if exists */}
          {additionalTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Itens adicionais:</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(additionalTotal)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-bold">
            <span>TOTAL:</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}</span>
          </div>
        </div>
        
        <div className="mt-4 border-t border-[#E0E0E0] pt-4 text-center">
          <div className="flex items-center justify-center text-xs text-gray-600">
            <Shield className="w-4 h-4 mr-1" />
            <span>Compra segura e protegida</span>
          </div>
          
          {isDigitalProduct && (
            <p className="text-xs text-gray-600 mt-2 text-center">
              *Produto digital: entrega imediata após confirmação do pagamento
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
