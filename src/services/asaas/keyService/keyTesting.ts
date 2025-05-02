
import { ApiTestResult } from '../types';

/**
 * Testa uma chave API do Asaas
 * @param apiKey Chave API a ser testada
 * @param isSandbox Se deve testar em ambiente sandbox
 * @returns Resultado do teste
 */
export async function testApiKey(apiKey: string, isSandbox: boolean): Promise<ApiTestResult> {
  try {
    const baseUrl = isSandbox 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/api/v3';
      
    const url = `${baseUrl}/status`;
    
    // Sanitizar a chave para remover espaços, quebras de linha, etc.
    const sanitizedKey = apiKey.trim();

    // Use dynamic import for node-fetch to support both browser and Node environments
    const fetchModule = await import('node-fetch').catch(() => null);
    const fetch = fetchModule?.default || global.fetch;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sanitizedKey}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        status: response.status,
        data
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        status: response.status,
        message: `Erro na API: ${response.statusText}`,
        error: errorText
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Erro ao testar chave API',
      error: error.message
    };
  }
}
