
import React from 'react';
import { Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { BumpProduct, useOrderBump } from '@/hooks/useOrderBump';

interface OrderBumpProps {
  products: BumpProduct[];
  onTotalChange?: (total: number) => void;
}

export const OrderBump: React.FC<OrderBumpProps> = ({ products, onTotalChange }) => {
  const { toggleProduct, isSelected, total } = useOrderBump({ 
    products, 
    onTotalChange 
  });
  
  if (!products || products.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6 mb-4 space-y-4">
      <div className="text-lg font-medium mb-2 flex items-center">
        <span className="mr-2">🔥</span>
        Aproveite e complete seu pedido
      </div>
      
      <div className="space-y-4">
        {products.slice(0, 2).map((product) => (
          <div 
            key={product.id} 
            className={`border rounded-lg p-4 transition-all duration-200 ${
              isSelected(product.id) 
                ? 'border-custom-purple-500 bg-custom-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => toggleProduct(product.id)}
          >
            <div className="flex items-start">
              {/* Checkbox */}
              <div className="flex-shrink-0 mr-3 pt-0.5">
                <Checkbox 
                  checked={isSelected(product.id)}
                  onCheckedChange={() => toggleProduct(product.id)}
                  className="h-5 w-5 data-[state=checked]:bg-custom-purple-500"
                />
              </div>
              
              {/* Product content */}
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">{product.name}</h4>
                  <div className="font-medium text-sm">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(product.price)}
                  </div>
                </div>
                
                <p className="text-gray-600 text-xs mt-1">{product.description}</p>
                
                {/* Product image if available */}
                {product.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="h-14 w-auto object-contain rounded"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Selected indicator */}
            {isSelected(product.id) && (
              <div className="mt-2 text-xs flex items-center text-green-600">
                <Check className="h-3 w-3 mr-1" />
                <span>Produto adicionado</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {total > 0 && (
        <div className="text-sm font-medium text-right text-custom-purple-700">
          Total adicional: {new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(total)}
        </div>
      )}
    </div>
  );
};
