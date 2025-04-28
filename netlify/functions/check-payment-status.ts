
import { Handler } from '@netlify/functions';
import { supabase } from './asaas/supabase-client';
import { getAsaasApiKey } from './asaas/get-asaas-api-key';

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  // Verify method
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use GET.' })
    };
  }

  // Get payment ID
  const paymentId = event.queryStringParameters?.paymentId;
  console.log(`Checking status for paymentId: ${paymentId}`);
  
  if (!paymentId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Payment ID not provided.',
        status: 'ERROR'
      })
    };
  }

  try {
    // First check orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('status, updated_at')
      .eq('asaas_payment_id', paymentId)
      .maybeSingle();
    
    if (!orderError && orderData) {
      console.log(`Found payment status in orders table: ${orderData.status}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: orderData.status,
          paymentId,
          updatedAt: orderData.updated_at,
          source: 'orders_table'
        })
      };
    }
    
    // Check asaas_payments table
    const { data: paymentData, error: paymentError } = await supabase
      .from('asaas_payments')
      .select('status, updated_at')
      .eq('payment_id', paymentId)
      .maybeSingle();
    
    if (!paymentError && paymentData) {
      console.log(`Found payment status in asaas_payments table: ${paymentData.status}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: paymentData.status,
          paymentId,
          updatedAt: paymentData.updated_at,
          source: 'asaas_payments_table'
        })
      };
    }

    // If not found locally, check Asaas API
    try {
      console.log('Attempting to get status directly from Asaas API...');
      
      // Get Asaas configuration
      const { data: asaasConfig, error: configError } = await supabase
        .from('asaas_config')
        .select('*')
        .limit(1)
        .maybeSingle();
        
      if (configError) {
        throw new Error('Error fetching payment gateway configuration');
      }
      
      // Determine API key
      const usesSandbox = asaasConfig?.sandbox === true;
      const apiKey = await getAsaasApiKey(usesSandbox);
      
      if (!apiKey) {
        throw new Error(`${usesSandbox ? 'Sandbox' : 'Production'} API key not configured`);
      }
      
      // Query Asaas API
      const response = await fetch(`https://${usesSandbox ? 'sandbox.' : ''}api.asaas.com/v3/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Asaas API error: ${response.status}`);
      }
      
      const asaasData = await response.json();
      
      // Update local tables
      try {
        await supabase
          .from('asaas_payments')
          .upsert({
            payment_id: paymentId,
            status: asaasData.status,
            updated_at: new Date().toISOString()
          });
          
        const { data: orderInfo } = await supabase
          .from('orders')
          .select('id')
          .eq('asaas_payment_id', paymentId)
          .maybeSingle();
          
        if (orderInfo?.id) {
          await supabase
            .from('orders')
            .update({ 
              status: asaasData.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderInfo.id);
        }
      } catch (updateError) {
        console.error('Error updating local status:', updateError);
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: asaasData.status,
          paymentId,
          updatedAt: asaasData.dateCreated || new Date().toISOString(),
          source: 'asaas_api'
        })
      };
      
    } catch (asaasError) {
      console.error('Error querying Asaas API:', asaasError);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'PENDING',
          paymentId,
          updatedAt: new Date().toISOString(),
          source: 'error_fallback',
          error: asaasError instanceof Error ? asaasError.message : 'Error querying external API'
        })
      };
    }
  } catch (error) {
    console.error('General error in check-payment-status:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'PENDING',
        paymentId,
        updatedAt: new Date().toISOString(),
        source: 'error_handler',
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    };
  }
};
