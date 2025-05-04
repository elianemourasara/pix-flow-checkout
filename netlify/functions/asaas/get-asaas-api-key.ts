
import { supabase } from './supabase-client';
import { AsaasApiKey, AsaasEnvironment, ApiTestResult } from './types';

/**
 * Obtém a chave API ativa para ambiente de PRODUÇÃO (sempre)
 * @param isSandbox Parâmetro ignorado - sempre retorna chave de produção
 * @returns A chave API ativa ou null se não encontrada
 */
export async function getAsaasApiKey(isSandbox: boolean): Promise<string | null> {
  try {
    // Forçar o uso do ambiente de produção (isSandbox é ignorado)
    const forceProduction = true;
    
    console.log("[getAsaasApiKey] MODO FORÇADO: Buscando apenas chaves de PRODUÇÃO");
    
    // Buscar chaves ativas para o ambiente de produção, ordenadas por prioridade
    const { data: keys, error } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('is_sandbox', false) // Forçado para produção
      .eq('is_active', true)
      .order('priority', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar chaves API ativas:', error);
      
      // FALLBACK: Tentar obter diretamente da variável de ambiente se configurada
      const envKey = process.env.ASAAS_PRODUCTION_KEY_RAW || process.env.ASAAS_PRODUCTION_KEY;
      if (envKey) {
        console.log('Usando chave API do ambiente (fallback):', envKey.substring(0, 8) + '...');
        return envKey;
      }
      
      return null;
    }
    
    // Retornar a chave de maior prioridade (menor número)
    if (keys && keys.length > 0) {
      const apiKey = keys[0].api_key;
      console.log(`Chave API de produção encontrada: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
      
      // Verificar se a chave começa com $
      if (!apiKey.startsWith('$')) {
        console.warn('AVISO: A chave API não começa com $ - isso pode causar problemas de validação!');
      }
      
      return apiKey;
    }
    
    console.warn('Nenhuma chave API ativa encontrada para PRODUÇÃO!');
    
    // FALLBACK: Tentar obter diretamente da variável de ambiente se configurada
    const envKey = process.env.ASAAS_PRODUCTION_KEY_RAW || process.env.ASAAS_PRODUCTION_KEY;
    if (envKey) {
      console.log('Usando chave API do ambiente (fallback):', envKey.substring(0, 8) + '...');
      return envKey;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar chave API:', error);
    
    // FALLBACK: Tentar obter diretamente da variável de ambiente se configurada
    const envKey = process.env.ASAAS_PRODUCTION_KEY_RAW || process.env.ASAAS_PRODUCTION_KEY;
    if (envKey) {
      console.log('Usando chave API do ambiente após erro (fallback):', envKey.substring(0, 8) + '...');
      return envKey;
    }
    
    return null;
  }
}

/**
 * Testa uma chave API do Asaas
 * Função mantida por compatibilidade
 */
export async function testApiKey(apiKey: string, isSandbox: boolean): Promise<boolean> {
  // Força o uso de produção
  isSandbox = false;
  
  try {
    const baseUrl = 'https://api.asaas.com/api/v3';
    const url = `${baseUrl}/status`;
    
    // Use require for node-fetch to ensure compatibility
    const fetch = require('node-fetch');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Erro ao testar chave API:', error);
    return false;
  }
}

// Update the simulateCurlTest function to use the imported node-fetch
export async function simulateCurlTest(apiKey: string, isSandbox: boolean): Promise<any> {
  // Forçar o uso de produção
  isSandbox = false;
  
  try {
    // Import node-fetch dynamically to work with both ESM and CommonJS environments
    const fetch = require('node-fetch');
    
    const baseUrl = 'https://api.asaas.com/api/v3';
    const url = `${baseUrl}/status`;
    
    // Use node-fetch for the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const status = response.status;
    const responseText = await response.text();
    
    return {
      success: response.ok,
      status: status,
      response: responseText
    };
  } catch (error) {
    console.error('Error during cURL test:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
