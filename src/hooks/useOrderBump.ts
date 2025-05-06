
import { useState, useCallback } from 'react';

export interface BumpProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

interface UseOrderBumpProps {
  products: BumpProduct[];
  onTotalChange?: (total: number) => void;
}

export const useOrderBump = ({ products, onTotalChange }: UseOrderBumpProps) => {
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});
  
  const toggleProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      const updated = {
        ...prev,
        [productId]: !prev[productId]
      };
      
      // Calculate new total and call the callback
      const newTotal = calculateTotal(products, updated);
      if (onTotalChange) {
        onTotalChange(newTotal);
      }
      
      return updated;
    });
  }, [products, onTotalChange]);
  
  const calculateTotal = useCallback((products: BumpProduct[], selected: Record<string, boolean>) => {
    return products.reduce((total, product) => {
      return total + (selected[product.id] ? product.price : 0);
    }, 0);
  }, []);
  
  const total = calculateTotal(products, selectedProducts);
  
  const isSelected = useCallback((productId: string) => {
    return !!selectedProducts[productId];
  }, [selectedProducts]);
  
  const getSelectedProducts = useCallback(() => {
    return products.filter(product => selectedProducts[product.id]);
  }, [products, selectedProducts]);
  
  return {
    selectedProducts,
    toggleProduct,
    total,
    isSelected,
    getSelectedProducts
  };
};
