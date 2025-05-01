
import { supabase } from './supabase-client';
import { getAsaasApiBaseUrl } from './get-asaas-api-base-url';
import { sanitizeApiKey } from './diagnostics';

/**
 * Obtém a chave da API do Asaas com base no modo de operação (produção ou sandbox)
 * @param isSandbox Indica se deve buscar a chave sandbox ou produção
 * @returns Chave da API ou null se não encontrada
 */
export async function getAsaasApiKey(isSandbox: boolean): Promise<string | null> {
  // Log para mostrar se está buscando a chave sandbox ou produção
  console.log(`[getAsaasApiKey] Buscando chave API ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'}...`);
  
  try {
    // 1. Primeiro tenta obter uma chave ativa da tabela asaas_api_keys
    console.log(`[getAsaasApiKey] Consultando tabela asaas_api_keys para ambiente ${isSandbox ? 'sandbox' : 'produção'}...`);
    const { data: apiKeys, error: apiKeyError } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('is_sandbox', isSandbox)
      .eq('is_active', true)
      .order('priority', { ascending: true });
    
    if (apiKeyError) {
      console.error('[getAsaasApiKey] Erro ao consultar tabela asaas_api_keys:', apiKeyError);
      // Continua para o próximo método de obtenção
    } else if (apiKeys && apiKeys.length > 0) {
      // 1.1 Encontrou chaves na tabela, usar a de maior prioridade (menor número)
      const key = apiKeys[0];
      console.log(`[getAsaasApiKey] Encontrada chave ID ${key.id} (${key.key_name}) na tabela asaas_api_keys`);
      
      // Sanitizar e retornar a chave
      const sanitizedKey = sanitizeApiKey(key.api_key);
      
      // Log para debug (apenas primeiros e últimos caracteres por segurança)
      console.log(`[getAsaasApiKey] Retornando chave sanitizada: ${sanitizedKey.substring(0, 8)}...${sanitizedKey.substring(sanitizedKey.length - 4)}`);
      return sanitizedKey;
    }

    // 2. Se não encontrou na tabela específica, tenta na tabela de configuração geral
    console.log('[getAsaasApiKey] Nenhuma chave encontrada na tabela asaas_api_keys, consultando tabela asaas_config...');
    const { data: configData, error: configError } = await supabase
      .from('asaas_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    
    if (configError) {
      console.error('[getAsaasApiKey] Erro ao consultar tabela asaas_config:', configError);
      return null;
    }

    if (configData) {
      // 2.1 Verifica qual campo usar com base no modo
      const keyField = isSandbox ? 'sandbox_key' : 'production_key';
      const apiKey = configData[keyField];
      
      if (apiKey) {
        console.log(`[getAsaasApiKey] Encontrada chave em asaas_config (campo ${keyField})`);
        
        // Sanitizar e retornar a chave
        const sanitizedKey = sanitizeApiKey(apiKey);
        
        // Log para debug (apenas primeiros e últimos caracteres por segurança)
        console.log(`[getAsaasApiKey] Retornando chave sanitizada: ${sanitizedKey.substring(0, 8)}...${sanitizedKey.substring(sanitizedKey.length - 4)}`);
        return sanitizedKey;
      }
    }

    console.error('[getAsaasApiKey] Nenhuma chave API encontrada para o ambiente', isSandbox ? 'SANDBOX' : 'PRODUÇÃO');
    return null;
  } catch (error) {
    console.error('[getAsaasApiKey] Erro ao obter chave API:', error);
    return null;
  }
}

/**
 * Testa se uma chave de API do Asaas é válida
 * @param apiKey Chave de API para testar
 * @param isSandbox Indica se deve testar contra o ambiente sandbox
 * @returns true se a chave for válida
 */
export async function testApiKey(apiKey: string, isSandbox: boolean): Promise<boolean> {
  if (!apiKey) {
    console.error('[testApiKey] Chave API inválida (vazia ou nula)');
    return false;
  }

  try {
    console.log('[testApiKey] Testando chave API com fetch...');
    
    // Sanitizar a chave antes do teste
    const sanitizedKey = sanitizeApiKey(apiKey);
    
    const apiBaseUrl = getAsaasApiBaseUrl(isSandbox);
    const url = `${apiBaseUrl}/customers?limit=1`;
    
    console.log(`[testApiKey] URL: ${url}`);
    console.log(`[testApiKey] Authorization: Bearer ${sanitizedKey.substring(0, 8)}...${sanitizedKey.substring(sanitizedKey.length - 4)}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sanitizedKey}`,
        'User-Agent': 'Mozilla/5.0 Asaas-Integration-Test'
      }
    });

    if (response.ok) {
      console.log('[testApiKey] Teste bem-sucedido - Status:', response.status);
      return true;
    } else {
      console.error(`[testApiKey] Teste falhou - Status: ${response.status}`);
      
      // Log detalhado para diagnóstico
      try {
        const responseText = await response.text();
        console.error('[testApiKey] Resposta de erro:', responseText);
      } catch (e) {
        console.error('[testApiKey] Não foi possível ler o corpo da resposta:', e);
      }
      
      return false;
    }
  } catch (error) {
    console.error('[testApiKey] Erro ao testar chave API:', error);
    return false;
  }
}

/**
 * Simula um teste cURL para diagnóstico mais preciso
 * @param apiKey Chave API para testar
 * @param isSandbox Indica se deve usar ambiente sandbox
 * @returns Resultado do teste
 */
export async function simulateCurlTest(apiKey: string, isSandbox: boolean): Promise<{
  success: boolean,
  status?: number,
  response?: string,
  error?: string
}> {
  if (!apiKey) {
    return {
      success: false,
      error: 'Chave API não fornecida'
    };
  }
  
  try {
    console.log('[simulateCurlTest] Simulando teste cURL com fetch nativo...');
    
    // Usar a chave sanitizada
    const sanitizedKey = sanitizeApiKey(apiKey);
    
    const apiBaseUrl = getAsaasApiBaseUrl(isSandbox);
    const url = `${apiBaseUrl}/status`;
    
    // Usar fetch nativo com configurações específicas
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sanitizedKey}`,
        'User-Agent': 'curl/7.64.1' // Simular um User-Agent curl
      }
    });
    
    let responseText = '';
    try {
      responseText = await response.text();
    } catch (e) {
      console.warn('[simulateCurlTest] Não foi possível ler a resposta como texto:', e);
    }
    
    return {
      success: response.ok,
      status: response.status,
      response: responseText
    };
  } catch (error: any) {
    console.error('[simulateCurlTest] Erro no teste cURL:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Exporta funções principais
export { getAsaasApiBaseUrl };
