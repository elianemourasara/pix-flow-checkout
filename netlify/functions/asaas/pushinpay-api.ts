
import { UTMData } from '../types';

interface PushinPayRequestBody {
  value: number;
  description: string;
  external_reference: string;
  callback_url: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface PushinPayResponse {
  payment_url: string;
  qr_code_url: string;
  endToEndId: string;
  status: string;
}

/**
 * Creates a payment through PushinPay API
 */
export const criarCobrancaViaPushinPay = async ({
  amount,
  description,
  externalReference,
  utms
}: {
  amount: number;
  description: string;
  externalReference: string;
  utms?: UTMData;
}): Promise<PushinPayResponse> => {
  try {
    console.log('[PushinPay] Creating payment with amount:', amount);
    const apiKey = process.env.PUSHINPAY_API_KEY;
    const webhookUrl = process.env.PUSHINPAY_WEBHOOK_URL;
    
    if (!apiKey) {
      throw new Error('PushinPay API key not configured');
    }
    
    if (!webhookUrl) {
      throw new Error('PushinPay webhook URL not configured');
    }
    
    const requestBody: PushinPayRequestBody = {
      value: amount,
      description,
      external_reference: externalReference,
      callback_url: webhookUrl,
    };
    
    // Add UTM parameters if available
    if (utms) {
      if (utms.utm_source) requestBody.utm_source = utms.utm_source;
      if (utms.utm_medium) requestBody.utm_medium = utms.utm_medium;
      if (utms.utm_campaign) requestBody.utm_campaign = utms.utm_campaign;
      if (utms.utm_term) requestBody.utm_term = utms.utm_term;
      if (utms.utm_content) requestBody.utm_content = utms.utm_content;
    }
    
    console.log('[PushinPay] Request body:', requestBody);
    
    const response = await fetch('https://api.pushinpay.com.br/api/v1/checkout/pix', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PushinPay] Error response:', errorText);
      throw new Error(`PushinPay API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[PushinPay] Response:', data);
    
    return {
      payment_url: data.payment_url,
      qr_code_url: data.qr_code_url,
      endToEndId: data.endToEndId || '',
      status: data.status || 'PENDING'
    };
  } catch (error) {
    console.error('[PushinPay] Error:', error);
    throw error;
  }
};
