
import { useState, useCallback, useEffect } from 'react';
import { BumpProduct } from '@/types/checkout';
import { UseOrderBumpProps, UseOrderBumpReturn } from '@/components/checkout/OrderBump/types';

export const useOrderBump = ({ products, onChange }: UseOrderBumpProps): UseOrderBumpReturn => {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  
  // Reset selectedIds when products change
  useEffect(() => {
    console.log("Products no useOrderBump:", products);
    if (products && products.length > 0) {
      setSelectedIds({});
    }
  }, [products]);
  
  const toggleProduct = useCallback((productId: string) => {
    console.log("Alternando produto:", productId);
    setSelectedIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  }, []);
  
  const isSelected = useCallback((productId: string) => {
    return !!selectedIds[productId];
  }, [selectedIds]);
  
  const selectedProducts = products.filter(product => selectedIds[product.id]);
  
  const total = products.reduce((sum: number, product: BumpProduct) => {
    return sum + (selectedIds[product.id] ? product.price : 0);
  }, 0);
  
  // Call onChange whenever selected products change
  useEffect(() => {
    if (onChange) {
      console.log("Chamando onChange com produtos selecionados:", selectedProducts, "e total:", total);
      onChange(selectedProducts, total);
    }
  }, [selectedIds, onChange, selectedProducts, total, products]);
  
  return {
    selectedProducts,
    toggleProduct,
    isSelected,
    total
  };
};
