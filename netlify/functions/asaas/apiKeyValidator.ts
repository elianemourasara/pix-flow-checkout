
import * as https from 'https';

/**
 * Serviço para validação de chaves API
 */
export const apiKeyValidator = {
  /**
   * Valida uma chave API
   * @param apiKey Chave API para validar
   * @param apiBaseUrl URL base da API
   * @returns Resultado da validação
   */
  validateKey: async (apiKey: string, apiBaseUrl: string) => {
    console.log('[apiKeyValidator] Verificando formato da chave API...');
    console.log('[apiKeyValidator] Começa com $:', apiKey.startsWith('$'));
    console.log('[apiKeyValidator] Comprimento da chave:', apiKey.length);
    
    // Verificar formato Asaas - DEVE começar com $
    if (!apiKey.startsWith('$')) {
      console.error('[apiKeyValidator] ERRO CRÍTICO: Chave não começa com $, formato inválido para o Asaas');
      return {
        isValid: false,
        message: 'Formato de chave API inválido - não começa com $aact_'
      };
    }
    
    // Verificar se a chave começa com $aact_
    if (!apiKey.startsWith('$aact_')) {
      console.warn('[apiKeyValidator] AVISO: Chave não segue o padrão completo $aact_, pode causar problemas');
    }
    
    console.log('[apiKeyValidator] Chave com formato correto - com prefixo $');
    return {
      isValid: true,
      message: 'Chave API com formato correto (com prefixo $)'
    };
  }
};
