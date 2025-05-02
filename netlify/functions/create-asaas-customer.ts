
// /netlify/functions/create-asaas-customer.ts (com validação aprimorada)

import { Handler, HandlerEvent } from '@netlify/functions';
import { supabase } from './asaas/supabase-client';
import { AsaasCustomerRequest } from './asaas/types';
import { validateAsaasCustomerRequest } from './asaas/validation';
import { processPaymentFlow } from './asaas/payment-processor';
import { getAsaasApiKey, testApiKey } from './asaas/get-asaas-api-key';
import { getAsaasApiBaseUrl } from './asaas/get-asaas-api-base-url';
import { analyzeApiRequest } from './asaas/requestAnalyzer';
import { apiKeyValidator } from './asaas/apiKeyValidator';

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
  console.log(`[create-asaas-customer] Valor bruto da variável de ambiente: "${process.env.USE_ASAAS_PRODUCTION}"`);
  
  // Logging detalhado dos headers recebidos para análise de CORS e proxies
  console.log('[create-asaas-customer] Headers recebidos:', JSON.stringify(event.headers));
  
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
    // Importar as funções de diagnóstico apenas quando necessário
    const { analyzeApiKey } = await import('./asaas/diagnostics');
    
    // Analisar a requisição
    const requestAnalysis = analyzeApiRequest(event);
    
    const requestData: AsaasCustomerRequest = JSON.parse(event.body || '{}');
    console.log('[create-asaas-customer] Dados recebidos (parcial):', {
      name: requestData.name,
      cpfCnpjPartial: requestData.cpfCnpj ? `${requestData.cpfCnpj.substring(0, 4)}...` : 'não fornecido',
      email: requestData.email,
      phone: requestData.phone,
      orderId: requestData.orderId,
      value: requestData.value
    });

    // Validar os dados do cliente
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
    const useProductionEnvRaw = process.env.USE_ASAAS_PRODUCTION;
    const useProduction = useProductionEnvRaw === 'true';
    const isSandbox = !useProduction;

    console.log(`[create-asaas-customer] Valor bruto da variável USE_ASAAS_PRODUCTION: "${useProductionEnvRaw}"`);
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

    // Análise detalhada da chave API
    const keyAnalysis = analyzeApiKey(apiKey);
    console.log('[create-asaas-customer] Análise da chave API:', JSON.stringify({
      ...keyAnalysis,
      // Não incluir a chave completa nos logs
      firstEight: keyAnalysis.firstEight,
      lastFour: keyAnalysis.lastFour
    }, null, 2));
    
    if (!keyAnalysis.valid) {
      console.error('[create-asaas-customer] ERRO CRÍTICO: A chave API tem problemas de formato!');
      
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Invalid API key format',
          details: {
            containsInvisibleChars: keyAnalysis.containsInvisibleChars,
            containsQuotes: keyAnalysis.containsQuotes,
            hasPrefixDollar: keyAnalysis.hasPrefixDollar,
            format: keyAnalysis.format,
            length: keyAnalysis.length
          }
        }),
      };
    }

    // Validar a chave API
    const apiValidationResult = await apiKeyValidator.validateKey(apiKey, apiBaseUrl);
    if (!apiValidationResult.isValid) {
      console.error('[create-asaas-customer] ERRO: A chave API não passou no teste de validação!');
      
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'API key validation failed',
          message: apiValidationResult.message
        }),
      };
    } else {
      console.log('[create-asaas-customer] Chave API válida, prosseguindo com o processamento');
    }

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
