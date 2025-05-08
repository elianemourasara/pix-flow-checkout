export interface SupabasePaymentData {
  order_id: string;
  payment_id: string;
  status: string;
  amount: number;
  qr_code: string;
  qr_code_image: string;
  copy_paste_key: string;
  expiration_date: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
}

export interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  netValue: number;
  description: string;
}

export interface AsaasPixQrCodeResult {
  encodedImage: string;
  payload: string;
  expirationDate: string;
  success: boolean;
}

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface AsaasCustomerRequest {
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  orderId: string;
  value: number;
  description?: string;
  utms?: UTMData;
}
