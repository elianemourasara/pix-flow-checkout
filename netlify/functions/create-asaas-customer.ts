
import { Handler, HandlerEvent } from '@netlify/functions';
import { supabase } from './asaas/supabase-client';
import { AsaasCustomerRequest } from './asaas/types';
import { validateAsaasCustomerRequest } from './asaas/validation';
import { processPaymentFlow } from './asaas/payment-processor';
import { getAsaasApiKey } from './asaas/get-asaas-api-key';
import { getAsaasApiBaseUrl } from './asaas/get-asaas-api-base-url';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};

const handler: Handler = async (event: HandlerEvent) => {
  console.log('[create-asaas-customer] -------- Iniciando requisição --------');
  console.log(`[create-asaas-customer] Método: ${event.httpMethod}`);
  
  // Check for payment provider configuration
  const paymentProvider = process.env.PAYMENT_PROVIDER || 'asaas';
  console.log(`[create-asaas-customer] Payment provider: ${paymentProvider}`);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const requestData: AsaasCustomerRequest = JSON.parse(event.body || '{}');
    console.log('[create-asaas-customer] Dados recebidos (parcial):', {
      name: requestData.name,
      cpfCnpjPartial: requestData.cpfCnpj ? `${requestData.cpfCnpj.substring(0, 4)}...` : 'não fornecido',
      email: requestData.email,
      phone: requestData.phone,
      orderId: requestData.orderId,
      value: requestData.value,
      utms: requestData.utms
    });

    const validationError = validateAsaasCustomerRequest(requestData);
    if (validationError) {
      console.error('[create-asaas-customer] Erro de validação:', validationError);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: validationError }),
      };
    }

    // Check if we should use PushinPay
    if (paymentProvider === 'pushinpay') {
      console.log('[create-asaas-customer] Using PushinPay as payment provider');
      
      // Store UTM parameters in orders table
      if (requestData.utms) {
        await supabase
          .from('orders')
          .update({
            utm_source: requestData.utms.utm_source || null,
            utm_medium: requestData.utms.utm_medium || null,
            utm_campaign: requestData.utms.utm_campaign || null,
            utm_term: requestData.utms.utm_term || null,
            utm_content: requestData.utms.utm_content || null
          })
          .eq('id', requestData.orderId);
          
        console.log('[create-asaas-customer] UTM parameters stored in database');
      }
    }
    
    // Get API configuration
    const isSandbox = process.env.USE_ASAAS_PRODUCTION !== 'true';
    console.log(`[create-asaas-customer] Modo de operação: ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);
    
    const apiBaseUrl = getAsaasApiBaseUrl(isSandbox);
    console.log(`[create-asaas-customer] API Base URL: ${apiBaseUrl}`);

    const apiKey = await getAsaasApiKey(isSandbox);
    
    if (!apiKey) {
      console.error(`[create-asaas-customer] ERRO: Nenhuma chave API configurada`);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }
    
    const result = await processPaymentFlow(requestData, apiKey, supabase, apiBaseUrl);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };

  } catch (error: any) {
    console.error('[create-asaas-customer] ERRO CRÍTICO:', error);
    console.error('[create-asaas-customer] Nome do erro:', error.name);
    console.error('[create-asaas-customer] Mensagem:', error.message);
    
    // Verificar se há detalhes de erro no formato da API Asaas
    if (error.details) {
      console.error('[create-asaas-customer] Detalhes do erro:', JSON.stringify(error.details));
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Falha no processamento do pagamento',
        message: error.message || 'Erro desconhecido',
        errorName: error.name || 'Error',
        details: error.details || undefined
      }),
    };
  }
};

export { handler };
