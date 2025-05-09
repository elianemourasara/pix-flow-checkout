
import React from 'react';
import { Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useOrderBump } from '@/hooks/useOrderBump';
import { OrderBumpProps } from './types';

export const OrderBump: React.FC<OrderBumpProps> = ({ products, onChange }) => {
  const { toggleProduct, isSelected, selectedProducts, total } = useOrderBump({ 
    products, 
    onChange 
  });
  
  if (!products || products.length === 0) {
    console.log("Nenhum produto de OrderBump para exibir");
    return null;
  }
  
  return (
    <div className="space-y-3 border-0">
      <div className="flex items-center">
        <span className="mr-2">🔥</span>
        <span className="text-sm font-medium">Aproveite e complete seu pedido</span>
      </div>
      
      <div className="space-y-3">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="border rounded-lg p-3 transition-all duration-200 hover:border-gray-300 bg-white"
            onClick={() => toggleProduct(product.id)}
          >
            <div className="flex items-start">
              {/* Checkbox */}
              <div className="flex-shrink-0 mr-3 pt-0.5">
                <Checkbox 
                  checked={isSelected(product.id)}
                  onCheckedChange={() => toggleProduct(product.id)}
                  className="h-4 w-4 data-[state=checked]:bg-custom-purple-500"
                />
              </div>
              
              {/* Product content */}
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium uppercase text-xs">{product.name}</h4>
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
                      className="h-12 w-auto object-contain rounded"
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
        <div className="text-xs font-medium text-right text-custom-purple-700">
          Total adicional: {new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(total)}
        </div>
      )}
    </div>
  );
};
