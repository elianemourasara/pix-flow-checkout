// /netlify/functions/create-asaas-customer.ts (com validação aprimorada)

import { Handler, HandlerEvent } from '@netlify/functions';
import { supabase } from './asaas/supabase-client';
import { AsaasCustomerRequest } from './asaas/types';
import { validateAsaasCustomerRequest } from './asaas/validation';
import { processPaymentFlow } from './asaas/payment-processor';
import { getAsaasApiKey, testApiKey, simulateCurlTest } from './asaas/get-asaas-api-key';
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

    // NOVA ANÁLISE: Análise detalhada da chave API
    const keyAnalysis = analyzeApiKey(apiKey);
    console.log('[create-asaas-customer] Análise da chave API:', JSON.stringify({
      ...keyAnalysis,
      // Não incluir a chave completa nos logs
      firstEight: keyAnalysis.firstEight,
      lastFour: keyAnalysis.lastFour
    }, null, 2));
    
    if (!keyAnalysis.valid) {
      console.error('[create-asaas-customer] ERRO CRÍTICO: A chave API tem problemas de formato!');
      
      if (keyAnalysis.containsInvisibleChars) {
        console.error('[create-asaas-customer] ERRO: A chave contém caracteres invisíveis que causam falhas de autenticação!');
        console.error('[create-asaas-customer] Caracteres invisíveis detectados:', keyAnalysis.invisibleChars);
      }
      
      if (keyAnalysis.containsQuotes) {
        console.error('[create-asaas-customer] ERRO: A chave contém aspas que devem ser removidas!');
      }
      
      if (!keyAnalysis.hasPrefixDollar) {
        console.error('[create-asaas-customer] ERRO: A chave não tem o formato esperado ($aact_)');
      }
      
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

    // Validar a chave API antes de prosseguir
    console.log(`[create-asaas-customer] Chave API analisada: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`[create-asaas-customer] Comprimento da chave: ${apiKey.length} caracteres`);
    
    // Verificação preliminar do formato da chave
    if (!apiKey.startsWith('$aact_')) {
      console.error(`[create-asaas-customer] ALERTA CRÍTICO: A chave API não começa com "$aact_", formato possivelmente inválido`);
    }
    
    // Verificar se a chave contém espaços ou caracteres problemáticos
    if (apiKey.includes(' ')) {
      console.warn('[create-asaas-customer] ALERTA: A chave API contém espaços, o que pode causar falhas de autenticação');
    }

    // Exibir teste de caracteres especiais
    const specialCharsRegex = /[^\w\-\._$]/g;
    const hasSpecialChars = specialCharsRegex.test(apiKey);
    console.log(`[create-asaas-customer] Caracteres especiais na chave? ${hasSpecialChars ? 'SIM' : 'NÃO'}`);
    
    if (hasSpecialChars) {
      const matches = apiKey.match(specialCharsRegex);
      if (matches) {
        console.log(`[create-asaas-customer] Caracteres especiais encontrados: ${JSON.stringify(matches)}`);
        console.log(`[create-asaas-customer] Posições dos caracteres especiais: ${matches.map(char => apiKey.indexOf(char)).join(', ')}`);
      }
    }
    
    // MODIFICAÇÃO: Realizar teste com node-fetch nativo e https.Agent específico
    console.log('[create-asaas-customer] Testando conexão direta com node-fetch e https.Agent personalizado...');
    const https = await import('https');
    const fetch = require('node-fetch');
    
    const agent = new https.Agent({
      rejectUnauthorized: true,
      keepAlive: true,
      timeout: 30000
    });
    
    try {
      const testResponse = await fetch(`${apiBaseUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Mozilla/5.0 (compatible; AsaasNetlifyTest/1.0)',
          'Accept': '*/*'
        },
        // @ts-ignore - Tipagem incompatível entre node-fetch e fetch nativo
        agent
      });
      
      console.log(`[create-asaas-customer] Teste de conexão: Status ${testResponse.status}`);
      console.log(`[create-asaas-customer] Headers da resposta:`, 
        JSON.stringify(Object.fromEntries([...testResponse.headers]), null, 2));
      
      const responseText = await testResponse.text();
      console.log(`[create-asaas-customer] Resposta: ${responseText.substring(0, 200)}`);
      
      if (!testResponse.ok) {
        console.error(`[create-asaas-customer] ERRO: Teste manual falhou com status ${testResponse.status}`);
        
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'API test failed',
            status: testResponse.status,
            response: responseText
          }),
        };
      }
    } catch (testError) {
      console.error('[create-asaas-customer] Erro no teste manual:', testError);
      
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'API connection test failed',
          message: testError.message
        }),
      };
    }
    
    // Teste cURL simulado para diagnóstico mais preciso
    console.log('[create-asaas-customer] Executando teste cURL simulado...');
    const curlTest = await simulateCurlTest(apiKey, isSandbox);
    
    if (curlTest.success) {
      console.log('[create-asaas-customer] Teste cURL simulado BEM-SUCEDIDO!');
    } else {
      console.error(`[create-asaas-customer] Teste cURL simulado FALHOU: Status ${curlTest.status}`);
      console.error('[create-asaas-customer] Resposta do teste cURL:', curlTest.response || curlTest.error);
      console.error('[create-asaas-customer] ERRO CRÍTICO: A chave API parece ser inválida ou expirada.');
      console.error('[create-asaas-customer] Sugestão: Gerar uma nova chave de API no painel do Asaas.');
      
      // Teste direto com fetch sem configurações adicionais
      console.log('[create-asaas-customer] Tentando chamada fetch direta sem usar nossa função de teste...');
      
      try {
        // Este teste usa fetch diretamente para eliminar quaisquer problemas em nossas funções
        const directFetchResponse = await fetch(`${apiBaseUrl}/status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`[create-asaas-customer] Teste fetch direto: Status ${directFetchResponse.status}`);
        console.log('[create-asaas-customer] Headers da resposta:', JSON.stringify(Object.fromEntries([...directFetchResponse.headers]), null, 2));
        
        // Tentar verificar se há problemas de proxy ou rede
        console.log('[create-asaas-customer] Testando latência e conectividade...');
        const startTime = Date.now();
        await fetch('https://api.asaas.com/api/v3/status', { method: 'GET' });
        const endTime = Date.now();
        console.log(`[create-asaas-customer] Tempo de resposta para api.asaas.com: ${endTime - startTime}ms`);
      } catch (networkError) {
        console.error('[create-asaas-customer] Erro de rede na chamada direta:', networkError);
      }
    }

    // Verificação preliminar da chave antes de prosseguir
    console.log('[create-asaas-customer] Testando a validade da chave API com configuração adaptada...');
    
    // Teste com diferentes configurações de fetch
    // Primeira tentativa: com credenciais
    try {
      const responseWithCreds = await fetch(`${apiBaseUrl}/customers?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        credentials: 'include' // Teste com credenciais incluídas
      });
      
      console.log(`[create-asaas-customer] Teste com credentials:include: Status ${responseWithCreds.status}`);
    } catch (e) {
      console.error('[create-asaas-customer] Erro no teste com credentials:', e);
    }
    
    // Segunda tentativa: sem cache
    try {
      const responseNoCache = await fetch(`${apiBaseUrl}/customers?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Cache-Control': 'no-cache, no-store'
        }
      });
      
      console.log(`[create-asaas-customer] Teste sem cache: Status ${responseNoCache.status}`);
    } catch (e) {
      console.error('[create-asaas-customer] Erro no teste sem cache:', e);
    }
    
    // Teste original
    const isKeyValid = await testApiKey(apiKey, isSandbox);
    if (!isKeyValid) {
      console.error('[create-asaas-customer] ERRO: A chave API não passou no teste de validação!');
      console.error('[create-asaas-customer] Sugestão: Gerar uma nova chave de API no painel do Asaas.');
      
      // Retornar erro para o cliente
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'API key validation failed',
          message: 'A chave API do Asaas foi rejeitada. Por favor, verifique suas configurações e gere uma nova chave no painel do Asaas.'
        }),
      };
    } else {
      console.log('[create-asaas-customer] Chave API válida, prosseguindo com o processamento');
    }

    // Exibe o header de autorização formatado (primeiros caracteres apenas)
    const authHeader = `Bearer ${apiKey}`;
    console.log(`[create-asaas-customer] Authorization header (formato): Bearer ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`[create-asaas-customer] Comprimento total do header: ${authHeader.length}`);

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
