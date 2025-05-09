
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
    <div className="space-y-3 bg-white rounded-lg">
      {products.map((product) => (
        <div 
          key={product.id} 
          className="border border-dashed border-blue-300 rounded-md p-4 bg-blue-50"
        >
          <div className="text-center text-blue-600 font-bold uppercase mb-3">
            SIM, EU ACEITO ESSA OFERTA ESPECIAL!
          </div>
          
          <div className="flex items-start">
            {/* Red arrow and checkbox */}
            <div className="flex items-start mr-3">
              <div className="text-red-500 text-2xl mr-1">➔</div>
              <Checkbox 
                checked={isSelected(product.id)}
                onCheckedChange={() => toggleProduct(product.id)}
                className="h-5 w-5 mt-1 border-gray-400"
              />
            </div>
            
            {/* Product image */}
            {product.imageUrl && (
              <div className="flex-shrink-0 mr-3">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="h-20 w-20 object-contain border border-gray-200 bg-white rounded"
                />
              </div>
            )}
            
            {/* Product content */}
            <div className="flex-grow">
              <h4 className="font-bold text-red-500">{product.name}</h4>
              <p className="text-gray-700 text-sm">{product.description}</p>
              
              {/* Price dropdown simulation */}
              <div className="mt-2 w-full max-w-xs">
                <div className="border border-gray-300 rounded bg-white p-2 flex justify-between items-center">
                  <span className="text-sm text-gray-700">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(product.price)}
                  </span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
