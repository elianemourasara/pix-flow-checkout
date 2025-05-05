
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
  console.log('[create-asaas-customer] MODO FORÇADO: PRODUÇÃO - Ignorando variável USE_ASAAS_PRODUCTION');
  console.log(`[create-asaas-customer] Valor IGNORADO da variável de ambiente: "${process.env.USE_ASAAS_PRODUCTION}"`);
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
      console.log("[ASAAS-DIAGNÓSTICO] - Caracteres invisíveis?", /[\u200B\u200C\u200D\uFEFF]/.test(apiKey));
      console.log("[ASAAS-DIAGNÓSTICO] - Tem quebra de linha?", apiKey.includes('\n') || apiKey.includes('\r'));
    }

    if (!apiKey) {
      console.error(`[create-asaas-customer] ERRO: Nenhuma chave API configurada`);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }
    
    // Sanitizar a chave: remover espaços, quebras de linha e caracteres invisíveis
    // IMPORTANTE: NÃO remover o caractere $ inicial
    let sanitizedKey = apiKey.trim().replace(/[\n\r\t\u200B\u200C\u200D\uFEFF]/g, '');
    
    // DEBUG: Verificar se a chave tem o formato correto para o Asaas ($aact_...)
    if (!sanitizedKey.startsWith('$')) {
      console.error("[DEBUG] ERRO CRÍTICO: A chave não começa com $, formato inválido para o Asaas!");
    }
    
    console.log("[DEBUG] Chave sanitizada, tamanho:", sanitizedKey.length);
    console.log("[DEBUG] Começa com $:", sanitizedKey.startsWith('$'));
    console.log("[DEBUG] Começa com $aact_:", sanitizedKey.startsWith('$aact_'));
    
    if (sanitizedKey !== apiKey) {
      console.warn("[DEBUG] Chave foi sanitizada - havia caracteres problemáticos!");
      console.log("[ASAAS-DIAGNÓSTICO] Diferenças na sanitização:");
      console.log("[ASAAS-DIAGNÓSTICO] - Original começa com $:", apiKey.startsWith('$'));
      console.log("[ASAAS-DIAGNÓSTICO] - Sanitizada começa com $:", sanitizedKey.startsWith('$'));
      console.log("[ASAAS-DIAGNÓSTICO] - Tamanho original:", apiKey.length);
      console.log("[ASAAS-DIAGNÓSTICO] - Tamanho sanitizado:", sanitizedKey.length);
    }

    // Verificação básica de formato da chave Asaas
    if (!sanitizedKey.startsWith('$')) {
      console.error('[create-asaas-customer] ERRO CRÍTICO: Chave API não segue o formato padrão $aact_*');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Invalid API key format', 
          details: {
            containsInvisibleChars: /[\u200B\u200C\u200D\uFEFF]/.test(apiKey),
            containsQuotes: /['"]/.test(apiKey),
            hasPrefixDollar: apiKey.startsWith('$'),
            format: apiKey.startsWith('$') ? 'padrão correto' : 'sem $ inicial',
            length: apiKey.length
          }
        }),
      };
    }
    
    // Teste de conexão básica com a API antes de prosseguir
    try {
      const fetch = require('node-fetch');
      console.log("[ASAAS-TEST] Testando conexão básica com API Asaas...");
      
      const testResponse = await fetch(`${apiBaseUrl}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sanitizedKey}`,
          'Accept': 'application/json',
          'User-Agent': 'AsaasCheck/1.0'
        }
      });
      
      console.log("[ASAAS-TEST] Status da resposta do teste:", testResponse.status);
      const testBody = await testResponse.text();
      console.log("[ASAAS-TEST] Corpo da resposta:", testBody);
      
      if (!testResponse.ok) {
        console.warn("[ASAAS-TEST] AVISO: Teste básico de API falhou, mas continuaremos tentando");
      } else {
        console.log("[ASAAS-TEST] Teste básico de API bem-sucedido");
      }
    } catch (testError) {
      console.error("[ASAAS-TEST] Erro no teste básico:", testError);
    }
    
    const result = await processPaymentFlow(requestData, sanitizedKey, supabase, apiBaseUrl);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };

  } catch (error: any) {
    console.error('[create-asaas-customer] ERRO CRÍTICO:', error);
    console.error('[create-asaas-customer] Nome do erro:', error.name);
    console.error('[create-asaas-customer] Mensagem:', error.message);
    console.error('[create-asaas-customer] Stack:', error.stack);
    
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
