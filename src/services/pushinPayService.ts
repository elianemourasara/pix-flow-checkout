
import { supabase } from '@/integrations/supabase/client';
import { UTMData } from '@/types/checkout';
import { generatePassword } from '@/utils/authUtils';

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
    console.log('[PushinPayService] Creating payment with PushinPay');
    const apiKey = import.meta.env.VITE_PUSHINPAY_API_KEY;
    const webhookUrl = import.meta.env.VITE_PUSHINPAY_WEBHOOK_URL;
    
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
    
    console.log('[PushinPayService] Request body:', requestBody);
    
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
      console.error('[PushinPayService] Error response:', errorText);
      throw new Error(`PushinPay API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[PushinPayService] Response:', data);
    
    return {
      payment_url: data.payment_url,
      qr_code_url: data.qr_code_url,
      endToEndId: data.endToEndId || '',
      status: data.status || 'PENDING'
    };
  } catch (error) {
    console.error('[PushinPayService] Error:', error);
    throw error;
  }
};

/**
 * Updates order with PushinPay payment information
 */
export const updateOrderWithPushinPayData = async (
  orderId: string,
  paymentData: PushinPayResponse
) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        gateway: 'pushinpay',
        payment_url: paymentData.payment_url,
        qr_code_url: paymentData.qr_code_url,
        end_to_end_id: paymentData.endToEndId,
        external_reference: orderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (error) {
      console.error('[PushinPayService] Error updating order:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('[PushinPayService] Error in updateOrderWithPushinPayData:', error);
    throw error;
  }
};
