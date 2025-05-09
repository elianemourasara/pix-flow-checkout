// Expand the SupabasePaymentData interface to include checkout_session
export interface SupabasePaymentData {
  order_id: string;
  payment_id: string;
  status: string;
  amount: number;
  qr_code: string;
  qr_code_image: string;
  copy_paste_key: string;
  expiration_date: string;
  checkout_session?: string; // Add checkout session field
}

// Keep other type definitions as they are
export interface AsaasCustomerRequest {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  orderId: string;
  value: number;
  description?: string;
  utms?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}

export interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  mobilePhone: string;
  cpfCnpj: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  city: string;
  state: string;
  country: string;
  notificationDisabled: boolean;
  observations: string;
  createdAt: string;
  updatedAt: string;
}

export interface AsaasPaymentResponse {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  netValue: number;
  dueDate: string;
  status: string;
  description: string;
  externalReference: string;
  confirmation: {
    date: string;
  };
  deleted: boolean;
  postalService: boolean;
}

export interface AsaasPixQrCodeResponse {
  success: boolean;
  payload: string;
  encodedImage: string;
  expirationDate: string;
}

export class AsaasApiError extends Error {
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'AsaasApiError';
    this.details = details;
  }
}
