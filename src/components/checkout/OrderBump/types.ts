
import { BumpProduct } from '@/types/checkout';

export interface OrderBumpProps {
  products: BumpProduct[];
  onChange?: (selectedProducts: BumpProduct[], total: number) => void;
}

export { BumpProduct };
