
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
  console.log('[create-asaas-customer] MODO FORÇADO: PRODUÇÃO - Ignorando variável USE_ASAAS_PRODUCTION');

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

    // FORÇAR MODO PRODUÇÃO - ignorar variável de ambiente
    const isSandbox = false;
    console.log(`[create-asaas-customer] Modo de operação FORÇADO: PRODUÇÃO`);
    
    const apiBaseUrl = getAsaasApiBaseUrl(isSandbox);
    console.log(`[create-asaas-customer] API Base URL: ${apiBaseUrl}`);

    const apiKey = await getAsaasApiKey(isSandbox);
    
    // LOGS AVANÇADOS PARA DIAGNÓSTICO
    console.log("[ASAAS-DIAGNÓSTICO] === INFORMAÇÕES DA CHAVE API ===");
    console.log("[ASAAS-DIAGNÓSTICO] Tipo:", typeof apiKey);
    console.log("[ASAAS-DIAGNÓSTICO] Tamanho:", apiKey ? apiKey.length : 'CHAVE NÃO ENCONTRADA');
    
    if (apiKey) {
      console.log("[ASAAS-DIAGNÓSTICO] Primeiros caracteres:", apiKey.slice(0, 10));
      console.log("[ASAAS-DIAGNÓSTICO] Últimos caracteres:", apiKey.slice(-6));
      console.log("[ASAAS-DIAGNÓSTICO] Formato da chave:");
      console.log("[ASAAS-DIAGNÓSTICO] - Começa com $?", apiKey.startsWith('$'));
      console.log("[ASAAS-DIAGNÓSTICO] - Começa com aact_?", apiKey.startsWith('aact_'));
      console.log("[ASAAS-DIAGNÓSTICO] - Começa com $aact_?", apiKey.startsWith('$aact_'));
    }

    if (!apiKey) {
      console.error(`[create-asaas-customer] ERRO: Nenhuma chave API configurada`);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }
    
    // IMPORTANTE: NÃO modificar a chave de forma alguma
    console.log("[DEBUG] Chave original mantida, tamanho:", apiKey.length);
    console.log("[DEBUG] Começa com $:", apiKey.startsWith('$'));
    console.log("[DEBUG] Começa com $aact_:", apiKey.startsWith('$aact_'));
    
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
