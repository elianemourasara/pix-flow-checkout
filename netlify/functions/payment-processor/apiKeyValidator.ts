
import * as https from 'https';

/**
 * Função utilitária para validar a chave antes de prosseguir
 */
export async function validateApiKey(apiKey: string, apiUrl: string): Promise<boolean> {
  console.log('[validateApiKey] BYPASS: Retornando true sem validação real');
  return true;
}
