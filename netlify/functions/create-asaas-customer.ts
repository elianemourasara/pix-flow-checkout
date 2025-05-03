import { Handler, HandlerEvent } from '@netlify/functions';
import { supabase } from './asaas/supabase-client';
import { AsaasCustomerRequest } from './asaas/types';
import { validateAsaasCustomerRequest } from './asaas/validation';
import { processPaymentFlow } from './asaas/payment-processor';
import { getAsaasApiKey } from './asaas/get-asaas-api-key';
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
  console.log('[create-asaas-customer] Headers recebidos:', JSON.stringify(event.headers));

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
    const { analyzeApiKey } = await import('./asaas/diagnostics');
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

    const validationError = validateAsaasCustomerRequest(requestData);
    if (validationError) {
      console.error('[create-asaas-customer] Erro de validação:', validationError);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: validationError }),
      };
    }

    const useProductionEnvRaw = process.env.USE_ASAAS_PRODUCTION;
    const useProduction = useProductionEnvRaw === 'true';
    const isSandbox = !useProduction;

    console.log(`[create-asaas-customer] Modo de operação: ${useProduction ? 'PRODUÇÃO' : 'SANDBOX'}`);
    const apiBaseUrl = getAsaasApiBaseUrl(isSandbox);
    console.log(`[create-asaas-customer] API Base URL: ${apiBaseUrl}`);

    const apiKey = await getAsaasApiKey(isSandbox);

    // LOGS DE DEBUG PARA VERIFICAR FORMATO DA CHAVE
    console.log("[DEBUG] Tipo:", typeof apiKey);
    console.log("[DEBUG] Tamanho:", apiKey.length);
    console.log("[DEBUG] Início:", apiKey.slice(0, 10));
    console.log("[DEBUG] Fim:", apiKey.slice(-6));
    console.log("[DEBUG] Caracteres invisíveis?", /[\u200B\u200C\u200D\uFEFF]/.test(apiKey));
    console.log("[DEBUG] Tem quebra de linha?", apiKey.includes('\n') || apiKey.includes('\r'));
    console.log("[DEBUG] Começa com $?", apiKey.startsWith('$'));

    if (!apiKey) {
      console.error(`[create-asaas-customer] ERRO: Nenhuma chave API configurada`);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    const keyAnalysis = analyzeApiKey(apiKey);
    console.log('[create-asaas-customer] Análise da chave API:', JSON.stringify({
      valid: keyAnalysis.valid,
      hasPrefixDollar: keyAnalysis.hasPrefixDollar,
      format: keyAnalysis.format,
      length: keyAnalysis.length,
      firstEight: keyAnalysis.firstEight,
      lastFour: keyAnalysis.lastFour
    }, null, 2));

    if (!keyAnalysis.valid) {
      console.error('[create-asaas-customer] ERRO: A chave API tem problemas de formato!');
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
    }

    console.log('[create-asaas-customer] Chave API válida, prosseguindo com pagamento...');
    const result = await processPaymentFlow(requestData, apiKey, supabase, apiBaseUrl);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };

  } catch (error: any) {
    console.error('[create-asaas-customer] ERRO CRÍTICO:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Falha no processamento do pagamento',
        message: error.message || 'Erro desconhecido',
        errorName: error.name || 'Error'
      }),
    };
  }
};

export { handler };
