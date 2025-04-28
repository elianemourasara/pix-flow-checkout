// /netlify/functions/create-asaas-customer.ts (recriado com logs completos)

import { Handler, HandlerEvent } from '@netlify/functions';
import { supabase } from './asaas/supabase-client';
import { AsaasCustomerRequest } from './asaas/types';
import { validateAsaasCustomerRequest } from './asaas/validation';
import { processPaymentFlow } from './asaas/payment-processor';
import { getAsaasApiKey, getAsaasApiBaseUrl } from './asaas/get-asaas-api-key';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders
    };
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
    console.log('Solicitação recebida:', requestData);

    const validationError = validateAsaasCustomerRequest(requestData);
    if (validationError) {
      console.error('Erro de validação:', validationError);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: validationError }),
      };
    }

    const useProduction = process.env.USE_ASAAS_PRODUCTION === 'true';
    const isSandbox = !useProduction;

    const apiBaseUrl = getAsaasApiBaseUrl(isSandbox);
    console.log(`[INFO] Ambiente detectado: ${isSandbox ? 'Sandbox' : 'Produção'}`);
    console.log(`[INFO] API Base URL: ${apiBaseUrl}`);

    const apiKey = await getAsaasApiKey(isSandbox);
    if (!apiKey) {
      console.error(`[ERRO] Nenhuma chave API ${isSandbox ? 'sandbox' : 'produção'} configurada.`);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    console.log(`[INFO] Chave API obtida: ${apiKey.substring(0, 8)}...`);
    console.log('[INFO] Enviando para processPaymentFlow...');

    const result = await processPaymentFlow(
      requestData,
      apiKey,
      supabase,
      apiBaseUrl
    );

    console.log('[SUCESSO] Pagamento criado com sucesso:', result);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('[FATAL] Erro no processamento:', error);

    const errorDetails = {
      message: error.message || 'Erro desconhecido',
      name: error.name || 'Error',
      stack: error.stack ? error.stack.substring(0, 300) + '...' : 'No stack trace',
      details: error.details || null
    };

    console.error('[FATAL] Detalhes do erro:', errorDetails);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Falha no processamento do pagamento',
        details: error.message,
        errorName: error.name
      }),
    };
  }
};

export { handler };
