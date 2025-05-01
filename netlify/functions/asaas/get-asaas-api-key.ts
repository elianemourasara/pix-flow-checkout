import { supabase } from './supabase-client';
import { AsaasApiKey, AsaasEnvironment, ApiTestResult } from './types';

/**
 * Obtém a chave API ativa para um ambiente específico
 * @param isSandbox Se deve buscar chave para ambiente sandbox
 * @returns A chave API ativa ou null se não encontrada
 */
export async function getAsaasApiKey(isSandbox: boolean): Promise<string | null> {
  try {
    // Buscar chaves ativas para o ambiente especificado, ordenadas por prioridade
    const { data: keys, error } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('is_sandbox', isSandbox)
      .eq('is_active', true)
      .order('priority', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar chaves API ativas:', error);
      return null;
    }
    
    // Retornar a chave de maior prioridade (menor número)
    if (keys && keys.length > 0) {
      const apiKey = keys[0].api_key;
      console.log(`Chave API encontrada (sandbox=${isSandbox}): ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
      return apiKey;
    }
    
    console.warn(`Nenhuma chave API ativa encontrada para sandbox=${isSandbox}`);
    return null;
  } catch (error) {
    console.error('Erro ao buscar chave API:', error);
    return null;
  }
}

/**
 * Testa uma chave API do Asaas
 * @param apiKey Chave API a ser testada
 * @param isSandbox Se deve testar em ambiente sandbox
 * @returns Resultado do teste
 */
export async function testApiKey(apiKey: string, isSandbox: boolean): Promise<boolean> {
  try {
    const baseUrl = isSandbox 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/api/v3';
      
    const url = `${baseUrl}/status`;
    
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
  try {
    // Import node-fetch dynamically to work with both ESM and CommonJS environments
    const fetch = require('node-fetch');
    
    const baseUrl = isSandbox 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/api/v3';
      
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
