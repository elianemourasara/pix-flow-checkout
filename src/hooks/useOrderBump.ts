
import { useState, useCallback, useEffect } from 'react';
import { BumpProduct, UseOrderBumpProps, UseOrderBumpReturn } from '@/components/checkout/OrderBump/types';

export const useOrderBump = ({ products, onChange }: UseOrderBumpProps): UseOrderBumpReturn => {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  
  const toggleProduct = useCallback((productId: string) => {
    setSelectedIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  }, []);
  
  const isSelected = useCallback((productId: string) => {
    return !!selectedIds[productId];
  }, [selectedIds]);
  
  const selectedProducts = products.filter(product => selectedIds[product.id]);
  
  const total = products.reduce((sum, product) => {
    return sum + (selectedIds[product.id] ? product.price : 0);
  }, 0);
  
  // Call onChange whenever selected products change
  useEffect(() => {
    if (onChange) {
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
