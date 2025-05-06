
import { useState, useCallback, useEffect } from 'react';

export interface BumpProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

interface UseOrderBumpProps {
  products: BumpProduct[];
  onChange?: (selectedProducts: BumpProduct[], total: number) => void;
  onTotalChange?: (total: number) => void;
}

export const useOrderBump = ({ products, onChange, onTotalChange }: UseOrderBumpProps) => {
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
  
  const selectedProducts = useCallback(() => {
    return products.filter(product => selectedIds[product.id]);
  }, [products, selectedIds]);
  
  const total = useCallback(() => {
    return products.reduce((sum, product) => {
      return sum + (selectedIds[product.id] ? product.price : 0);
    }, 0);
  }, [products, selectedIds]);
  
  // Call onChange whenever selected products change
  useEffect(() => {
    const selected = selectedProducts();
    const currentTotal = total();
    
    if (onChange) {
      onChange(selected, currentTotal);
    }
    
    if (onTotalChange) {
      onTotalChange(currentTotal);
    }
  }, [selectedIds, onChange, onTotalChange, selectedProducts, total]);
  
  return {
    selectedProducts: selectedProducts(),
    toggleProduct,
    isSelected,
    total: total()
  };
};
