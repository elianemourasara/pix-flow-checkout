
// /netlify/functions/create-asaas-customer.ts (com validação aprimorada)

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
  console.log(`[create-asaas-customer] Ambiente: USE_ASAAS_PRODUCTION=${process.env.USE_ASAAS_PRODUCTION}`);
  console.log(`[create-asaas-customer] Valor bruto da variável de ambiente: ${process.env.USE_ASAAS_PRODUCTION}`);
  
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
    console.log('[create-asaas-customer] Dados recebidos (parcial):', {
      name: requestData.name,
      cpfCnpjPartial: requestData.cpfCnpj ? `${requestData.cpfCnpj.substring(0, 4)}...` : 'não fornecido',
      email: requestData.email,
      phone: requestData.phone,
      orderId: requestData.orderId,
      value: requestData.value
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

    // Verificar variáveis de ambiente e determinar ambiente correto
    const useProduction = process.env.USE_ASAAS_PRODUCTION === 'true';
    const isSandbox = !useProduction;

    console.log(`[create-asaas-customer] Modo de operação: ${useProduction ? 'PRODUÇÃO' : 'SANDBOX'}`);
    console.log(`[create-asaas-customer] isSandbox: ${isSandbox}`);

    // Obter URL base da API
    const apiBaseUrl = getAsaasApiBaseUrl(isSandbox);
    console.log(`[create-asaas-customer] API Base URL: ${apiBaseUrl}`);

    // Obter chave API com detalhes expandidos
    const apiKey = await getAsaasApiKey(isSandbox);
    if (!apiKey) {
      console.error(`[create-asaas-customer] ERRO CRÍTICO: Nenhuma chave API ${isSandbox ? 'sandbox' : 'produção'} configurada.`);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Validar a chave API antes de prosseguir
    console.log(`[create-asaas-customer] Chave API obtida: ${apiKey.substring(0, 8)}...`);
    console.log(`[create-asaas-customer] Comprimento da chave: ${apiKey.length} caracteres`);
    
    // Verificar se a chave contém espaços ou caracteres problemáticos
    if (apiKey.includes(' ')) {
      console.warn('[create-asaas-customer] ALERTA: A chave API contém espaços, o que pode causar falhas de autenticação');
    }

    // Exibir teste de caracteres especiais
    console.log(`[create-asaas-customer] Caracteres especiais na chave? ${/[^\w\-\.]/.test(apiKey) ? 'SIM' : 'NÃO'}`);

    // Exibe o header de autorização formatado (primeiros caracteres apenas)
    const authHeader = `Bearer ${apiKey}`;
    console.log(`[create-asaas-customer] Authorization header (formato): ${authHeader.substring(0, 15)}...`);

    console.log('[create-asaas-customer] Enviando para processPaymentFlow...');

    const result = await processPaymentFlow(
      requestData,
      apiKey,
      supabase,
      apiBaseUrl
    );

    console.log('[create-asaas-customer] Pagamento processado com sucesso:', result);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('[create-asaas-customer] ERRO CRÍTICO:', error);

    const errorDetails = {
      message: error.message || 'Erro desconhecido',
      name: error.name || 'Error',
      stack: error.stack ? error.stack.substring(0, 300) + '...' : 'No stack trace',
      details: error.details || null
    };

    console.error('[create-asaas-customer] Detalhes do erro:', errorDetails);

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
