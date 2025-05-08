export type ProductType = 'digital' | 'physical';
export type PaymentMethod = 'creditCard' | 'pix';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'OVERDUE' | 'ERROR' | 'DECLINED';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  banner_image_url: string;
  price: number;
  type: ProductType;
  isDigital: boolean;
  use_global_colors: boolean;
  button_color: string;
  heading_color: string;
  banner_color: string;
  has_whatsapp_support: boolean;
  whatsapp_number: string;
  status: string;
  order_bumps: BumpItem[];
}

export interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
}

export interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
}

export interface CreditCardData {
  holderName: string;
  number: string;
  expiryDate: string;
  cvv: string;
  brand?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCpfCnpj: string;
  customerPhone: string;
  productId: string;
  productName: string;
  productPrice: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  asaasPaymentId: string;
  createdAt: string;
  updatedAt: string;
  whatsapp_number?: string;
  has_whatsapp_support?: boolean;
  productType?: ProductType;
}

export interface PixPaymentData {
  orderId: string;
  paymentId: string;
  qrCode: string;
  qrCodeImage: string;
  copyPasteKey: string;
  expirationDate: string;
  value: number;
  description: string;
}

export interface CheckoutCustomization {
  buttonColor: string;
  headingColor: string;
  bannerColor: string;
  buttonText: string;
  useGlobalColors: boolean;
}

export interface BillingData {
  customer: CustomerData;
  value: number;
  description: string;
  orderId: string;
}

export interface BumpItem {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  active?: boolean;
}

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}
