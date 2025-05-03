import { ApiTestResult } from '../types';
import fetch from 'node-fetch';

/**
 * Diagnóstico avançado de chave API para identificar problemas comuns
 * @param apiKey Chave API a ser diagnosticada
 * @param isSandbox Se deve testar em ambiente sandbox
 * @returns Relatório de diagnóstico
 */
export async function diagnoseApiKey(apiKey: string, isSandbox: boolean): Promise<ApiTestResult> {
  try {
    // Extrair informações básicas
    const keyInfo = {
      length: apiKey.length,
      prefix: apiKey.substring(0, 6),
      format: apiKey.startsWith('$aact_') ? 'válido' : 'inválido',
      hasSpaces: apiKey.includes(' '),
      hasNewlines: apiKey.includes('\n') || apiKey.includes('\r'),
      environment: isSandbox ? 'sandbox' : 'produção'
    };
    
    console.log('[diagnoseApiKey] Diagnóstico de chave API:');
    console.log(`[diagnoseApiKey] Comprimento: ${keyInfo.length}`);
    console.log(`[diagnoseApiKey] Prefixo: ${keyInfo.prefix}`);
    console.log(`[diagnoseApiKey] Formato: ${keyInfo.format}`);
    console.log(`[diagnoseApiKey] Contém espaços: ${keyInfo.hasSpaces}`);
    console.log(`[diagnoseApiKey] Contém quebras de linha: ${keyInfo.hasNewlines}`);
    console.log(`[diagnoseApiKey] Ambiente: ${keyInfo.environment}`);
    
    // Verificar problemas comuns de configuração
    const USE_ASAAS_PRODUCTION = process.env.USE_ASAAS_PRODUCTION;
    console.log(`[diagnoseApiKey] Variável USE_ASAAS_PRODUCTION: ${USE_ASAAS_PRODUCTION}`);
    
    const isEnvironmentMismatch = 
      (USE_ASAAS_PRODUCTION === 'true' && isSandbox) || 
      (USE_ASAAS_PRODUCTION !== 'true' && !isSandbox);
    
    if (isEnvironmentMismatch) {
      console.warn('[diagnoseApiKey] AVISO: Possível conflito entre a variável de ambiente e o tipo de chave');
    }
    
    // Testar comunicação básica com a API
    try {
      const baseUrl = isSandbox 
        ? 'https://sandbox.asaas.com/api/v3'
        : 'https://api.asaas.com/api/v3';
        
      const url = `${baseUrl}/status`;
      
      // Sanitizar a chave para remover espaços, quebras de linha, etc.
      const sanitizedKey = apiKey.trim();

      console.log(`[diagnoseApiKey] Testando chave API ${isSandbox ? 'sandbox' : 'produção'}`);
      console.log(`[diagnoseApiKey] API URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sanitizedKey}`,
          'User-Agent': 'Mozilla/5.0 Lovable/1.0',
          'Accept': '*/*'
        }
      });
      
      console.log(`[diagnoseApiKey] Status da resposta: ${response.status}`);
      
      // Se a verificação básica falhou, retornar diagnóstico com informações
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[diagnoseApiKey] Erro ${response.status}: ${errorText}`);
        
        return {
          success: false,
          status: response.status,
          message: `Erro na API: ${response.statusText}`,
          error: errorText,
          data: {
            diagnostic: keyInfo,
            environmentVariable: USE_ASAAS_PRODUCTION,
            possibleIssues: [
              keyInfo.format === 'inválido' ? 'Formato da chave inválido' : null,
              keyInfo.hasSpaces ? 'A chave contém espaços' : null,
              keyInfo.hasNewlines ? 'A chave contém quebras de linha' : null,
              isEnvironmentMismatch ? 'Conflito de ambiente' : null
            ].filter(Boolean)
          }
        };
      }
      
      // Teste passou
      const data = await response.json();
      return {
        success: true,
        status: response.status,
        message: 'Chave API validada com sucesso',
        data: {
          diagnostic: keyInfo,
          environmentVariable: USE_ASAAS_PRODUCTION,
          apiResponse: data
        }
      };
      
    } catch (error: any) {
      // Erro de rede ou outro problema
      console.error('[diagnoseApiKey] Erro ao testar conectividade:', error);
      return {
        success: false,
        message: 'Erro ao testar conectividade com a API',
        error: error.message,
        data: {
          diagnostic: keyInfo,
          environmentVariable: USE_ASAAS_PRODUCTION,
          possibleIssues: [
            'Problema de conectividade',
            'Possível bloqueio de rede',
            keyInfo.format === 'inválido' ? 'Formato da chave inválido' : null
          ].filter(Boolean)
        }
      };
    }
  } catch (error: any) {
    console.error('[diagnoseApiKey] Erro durante diagnóstico:', error);
    return {
      success: false,
      message: 'Erro ao realizar diagnóstico da chave API',
      error: error.message
    };
  }
}
