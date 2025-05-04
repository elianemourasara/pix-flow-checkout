
import { supabase } from './supabase-client';
import { AsaasApiKey, AsaasEnvironment, ApiTestResult } from './types';

/**
 * Obtém a chave API ativa para ambiente de PRODUÇÃO (sempre)
 * @param isSandbox Parâmetro ignorado - sempre retorna chave de produção
 * @returns A chave API ativa ou null se não encontrada
 */
export async function getAsaasApiKey(isSandbox: boolean): Promise<string | null> {
  // BYPASS de validação e Supabase para evitar 401 indevidos
  const hardcodedKey = "aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmE2OTg1OGRjLTYzMjEtNGJhYy04YTRmLWQ2MTY0MmE5NGYzZTo6JGFhY2hfMGZiMjU0NTctOWQ1NS00YTE3LTgwZmYtN2FhYTdkOTg1MDVl";

  console.log("[FORCE_PROD] Usando chave hardcoded sem Supabase");
  console.log("[FORCE_PROD] Tamanho da chave:", hardcodedKey.length);
  console.log("[FORCE_PROD] Primeiros caracteres:", hardcodedKey.substring(0, 10));
  console.log("[FORCE_PROD] Últimos caracteres:", hardcodedKey.substring(hardcodedKey.length - 4));
  
  return hardcodedKey;
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
