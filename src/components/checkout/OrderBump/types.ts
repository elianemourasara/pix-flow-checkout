
export interface BumpProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

export interface OrderBumpProps {
  products: BumpProduct[];
  onChange?: (selectedProducts: BumpProduct[], total: number) => void;
}

export interface UseOrderBumpProps {
  products: BumpProduct[];
  onChange?: (selectedProducts: BumpProduct[], total: number) => void;
}

export interface UseOrderBumpReturn {
  selectedProducts: BumpProduct[];
  toggleProduct: (productId: string) => void;
  isSelected: (productId: string) => boolean;
  total: number;
}
