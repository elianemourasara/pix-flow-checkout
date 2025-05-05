
import * as https from 'https';

/**
 * Função utilitária para validar a chave antes de prosseguir
 */
export async function validateApiKey(apiKey: string, apiUrl: string): Promise<boolean> {
  console.log('[validateApiKey] Verificando formato da chave API...');
  console.log('[validateApiKey] Começa com $:', apiKey.startsWith('$'));
  console.log('[validateApiKey] Comprimento da chave:', apiKey.length);
  
  // Verificar formato Asaas
  if (!apiKey.startsWith('$')) {
    console.error('[validateApiKey] ERRO: A chave não começa com $, formato inválido para o Asaas!');
    return false;
  }
  
  console.log('[validateApiKey] BYPASS: Retornando true (chave com formato correto)');
  return true;
}
