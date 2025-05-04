
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
    
    // Verificação de formato de chave Asaas
    if (!apiKey.startsWith('$aact_')) {
      console.warn('[apiKeyValidator] AVISO CRÍTICO: Chave não começa com $aact_, formato possivelmente inválido');
    }
    
    try {
      // Configurar o agente HTTPS com opções
      const agent = new https.Agent({
        rejectUnauthorized: true,
        keepAlive: true,
        timeout: 30000
      });
      
      // Sanitizar a chave
      const sanitizedKey = apiKey.trim().replace(/[\s\u200B\u200C\u200D\uFEFF\n\r\t]/g, '');
      
      if (sanitizedKey !== apiKey) {
        console.warn('[apiKeyValidator] A chave foi sanitizada - continha caracteres invisíveis ou espaços');
      }
      
      console.log(`[apiKeyValidator] Testando chave sanitizada: ${sanitizedKey.substring(0, 8)}...${sanitizedKey.substring(sanitizedKey.length - 4)}`);
      console.log(`[apiKeyValidator] URL da API: ${apiBaseUrl}/status`);
      
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
      
      console.log(`[apiKeyValidator] Status da resposta: ${statusCode} (${statusOk ? 'OK' : 'ERRO'})`);
      
      if (!statusOk) {
        const errorText = await response.text();
        console.error(`[apiKeyValidator] Validação falhou com status ${statusCode}: ${errorText}`);
        
        // Teste adicional se for erro 401 - teste sem o prefixo $ se houver
        if (statusCode === 401 && sanitizedKey.startsWith('$')) {
          console.log('[apiKeyValidator] Tentando autenticação alternativa sem $ inicial...');
          
          const alternativeKey = sanitizedKey.substring(1); // Remove $
          
          const altResponse = await fetch(`${apiBaseUrl}/status`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${alternativeKey}`,
              'User-Agent': 'Lovable/Asaas Validator',
              'Accept': '*/*',
              'Cache-Control': 'no-cache'
            },
            agent,
            timeout: 30000
          });
          
          if (altResponse.ok) {
            console.log('[apiKeyValidator] Autenticação alternativa (sem $) funcionou! Considere atualizar a chave no banco.');
            return {
              isValid: true,
              message: 'Chave API válida (sem o $ inicial)',
              status: altResponse.status,
              alternativeFormat: true
            };
          } else {
            console.log('[apiKeyValidator] Autenticação alternativa também falhou.');
          }
        }
        
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
