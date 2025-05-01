
import { Handler, HandlerEvent } from '@netlify/functions';
import { supabase } from './asaas/supabase-client';
import { getAsaasApiKey } from './asaas/get-asaas-api-key';
import { getAsaasApiBaseUrl } from './asaas/get-asaas-api-base-url';
import { 
  runComprehensiveDiagnostics, 
  diagnoseDependencyIssues,
  analyzeApiKey,
  sanitizeApiKey,
  testMinimalHttpCall
} from './asaas/diagnostics';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};

const handler: Handler = async (event: HandlerEvent) => {
  console.log('[asaas-diagnostic] -------- Iniciando diagnóstico --------');
  console.log(`[asaas-diagnostic] Método: ${event.httpMethod}`);
  console.log(`[asaas-diagnostic] Ambiente: USE_ASAAS_PRODUCTION=${process.env.USE_ASAAS_PRODUCTION}`);
  
  // Logging de headers recebidos para análise de CORS e proxies
  console.log('[asaas-diagnostic] Headers recebidos:', JSON.stringify(event.headers));
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Determinar o ambiente com base na variável de ambiente
    const useProductionEnvRaw = process.env.USE_ASAAS_PRODUCTION;
    const useProduction = useProductionEnvRaw === 'true';
    const isSandbox = !useProduction;
    
    console.log(`[asaas-diagnostic] Valor bruto da variável USE_ASAAS_PRODUCTION: "${useProductionEnvRaw}"`);
    console.log(`[asaas-diagnostic] Modo de operação: ${useProduction ? 'PRODUÇÃO' : 'SANDBOX'}`);
    
    // Diagnóstico de dependências e ambiente
    console.log('[asaas-diagnostic] Iniciando diagnóstico de dependências e ambiente...');
    const dependencyDiagnostics = await diagnoseDependencyIssues();
    console.log('[asaas-diagnostic] Resultado do diagnóstico de dependências:', dependencyDiagnostics);
    
    // Obter a chave API
    console.log('[asaas-diagnostic] Obtendo chave API...');
    const apiKey = await getAsaasApiKey(isSandbox);
    
    if (!apiKey) {
      console.error('[asaas-diagnostic] Nenhuma chave API encontrada!');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'API key not found',
          environment: {
            useProduction,
            isSandbox,
            useProductionEnvRaw
          },
          dependencyDiagnostics
        }),
      };
    }
    
    // Analisar a chave API
    console.log('[asaas-diagnostic] Analisando formato da chave API...');
    const keyAnalysis = analyzeApiKey(apiKey);
    console.log('[asaas-diagnostic] Resultado da análise da chave:', JSON.stringify({
      ...keyAnalysis,
      // Não logar a chave completa, apenas os primeiros e últimos caracteres
      firstEight: keyAnalysis.firstEight,
      lastFour: keyAnalysis.lastFour
    }, null, 2));
    
    // Teste rápido com HTTP nativo para diagnóstico simples
    console.log('[asaas-diagnostic] Realizando teste HTTP nativo simples...');
    const minimalTest = await testMinimalHttpCall(sanitizeApiKey(apiKey), isSandbox);
    console.log('[asaas-diagnostic] Resultado do teste HTTP simples:', JSON.stringify({
      success: minimalTest.success,
      status: minimalTest.status
    }));
    
    // Executar diagnóstico completo
    console.log('[asaas-diagnostic] Executando diagnóstico completo...');
    const diagnosticResults = await runComprehensiveDiagnostics(apiKey, isSandbox);
    console.log('[asaas-diagnostic] Diagnóstico concluído');
    console.log('[asaas-diagnostic] Resumo:', diagnosticResults.summary);
    
    // Obter URL base da API para referência
    const apiBaseUrl = getAsaasApiBaseUrl(isSandbox);
    
    // Verificar tabelas relacionadas ao Asaas no Supabase para diagnóstico
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('asaas_api_keys')
      .select('*');
      
    const { data: asaasConfig, error: configError } = await supabase
      .from('asaas_config')
      .select('*');
      
    // Verificar logs recentes de webhooks para diagnóstico
    const { data: recentWebhooks, error: webhooksError } = await supabase
      .from('asaas_webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    // Verificar logs de pagamentos recentes para diagnóstico
    const { data: recentPayments, error: paymentsError } = await supabase
      .from('asaas_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        environment: {
          useProduction,
          isSandbox,
          useProductionEnvRaw,
          apiBaseUrl
        },
        dependencyDiagnostics,
        keyAnalysis: {
          ...keyAnalysis,
          // Remover a chave completa por segurança
          firstEight: keyAnalysis.firstEight,
          lastFour: keyAnalysis.lastFour,
          recommendedAction: keyAnalysis.recommendedAction
        },
        minimalHttpTest: {
          success: minimalTest.success,
          status: minimalTest.status,
          error: minimalTest.error
        },
        diagnosticResults: {
          summary: diagnosticResults.summary,
          testResults: Object.fromEntries(
            Object.entries(diagnosticResults.results).map(([key, result]) => [
              key,
              {
                success: result.success,
                statusCode: result.statusCode,
                headers: result.headers,
                error: result.error,
                // Não incluir a resposta completa por segurança e tamanho
                responsePreview: result.response ? result.response.substring(0, 100) + '...' : null
              }
            ])
          )
        },
        databaseInfo: {
          apiKeys: apiKeys ? {
            count: apiKeys.length,
            activeCount: apiKeys.filter(k => k.is_active).length,
            productionCount: apiKeys.filter(k => !k.is_sandbox).length,
            sandboxCount: apiKeys.filter(k => k.is_sandbox).length,
            // Não incluir as chaves completas
            preview: apiKeys.map(k => ({
              id: k.id,
              name: k.key_name,
              active: k.is_active,
              sandbox: k.is_sandbox,
              priority: k.priority
            }))
          } : null,
          apiKeysError: apiKeysError ? apiKeysError.message : null,
          asaasConfig: asaasConfig || null,
          configError: configError ? configError.message : null,
          recentWebhooks: recentWebhooks ? recentWebhooks.map(w => ({
            id: w.id,
            paymentId: w.payment_id,
            status: w.status,
            eventType: w.event_type,
            created_at: w.created_at,
          })) : null,
          webhooksError: webhooksError ? webhooksError.message : null,
          recentPayments: recentPayments ? recentPayments.map(p => ({
            id: p.id,
            paymentId: p.payment_id,
            status: p.status,
            created_at: p.created_at,
            amount: p.amount
          })) : null,
          paymentsError: paymentsError ? paymentsError.message : null
        }
      }),
    };
  } catch (error: any) {
    console.error('[asaas-diagnostic] Erro durante diagnóstico:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Diagnostic error',
        message: error.message,
        stack: error.stack ? error.stack.substring(0, 300) + '...' : null
      }),
    };
  }
};

export { handler };
