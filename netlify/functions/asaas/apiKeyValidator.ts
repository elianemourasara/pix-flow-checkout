
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
    console.log('[apiKeyValidator] Validando chave API...');
    
    if (!apiKey) {
      return {
        isValid: false,
        message: 'Chave API não fornecida'
      };
    }
    
    if (!apiKey.startsWith('$aact_')) {
      console.warn('[apiKeyValidator] Chave não começa com $aact_, formato possivelmente inválido');
    }
    
    try {
      // Configurar o agente HTTPS com opções
      const agent = new https.Agent({
        rejectUnauthorized: true,
        keepAlive: true,
        timeout: 30000
      });
      
      // Sanitizar a chave
      const sanitizedKey = apiKey.trim().replace(/\s/g, '');
      
      // Use require for node-fetch to ensure compatibility
      const fetch = require('node-fetch');
      const response = await fetch(`${apiBaseUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sanitizedKey}`,
          'User-Agent': 'Lovable/Asaas Validator',
          'Accept': '*/*',
          'Cache-Control': 'no-cache'
        },
        agent,
        timeout: 30000
      });
      
      const statusOk = response.ok;
      const statusCode = response.status;
      
      if (!statusOk) {
        const errorText = await response.text();
        console.error(`[apiKeyValidator] Validação falhou com status ${statusCode}: ${errorText}`);
        
        return {
          isValid: false,
          message: `A chave API foi rejeitada pela Asaas (status ${statusCode}). Por favor, verifique suas configurações e gere uma nova chave.`,
          status: statusCode,
          error: errorText
        };
      }
      
      return {
        isValid: true,
        message: 'Chave API válida',
        status: statusCode
      };
    } catch (error) {
      console.error('[apiKeyValidator] Erro ao validar chave API:', error);
      
      return {
        isValid: false,
        message: `Erro ao validar chave API: ${error.message}`,
        error: error.message
      };
    }
  }
};
