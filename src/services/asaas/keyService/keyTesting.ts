
import { ApiTestResult } from '../types';
import fetch from 'node-fetch';

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

    console.log(`[testApiKey] Testando chave API ${isSandbox ? 'sandbox' : 'produção'}`);
    console.log(`[testApiKey] Primeiros 8 caracteres: ${sanitizedKey.substring(0, 8)}...`);
    console.log(`[testApiKey] API URL: ${url}`);
    
    // Verificar formato básico da chave
    if (!sanitizedKey.startsWith('$aact_')) {
      console.warn('[testApiKey] AVISO: A chave não começa com "$aact_", formato possivelmente inválido');
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sanitizedKey}`,
        'User-Agent': 'Mozilla/5.0 Lovable/1.0',
        'Accept': '*/*'
      }
    });
    
    console.log(`[testApiKey] Status da resposta: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[testApiKey] Teste bem-sucedido, API respondeu corretamente');
      return {
        success: true,
        status: response.status,
        data
      };
    } else {
      const errorText = await response.text();
      console.error(`[testApiKey] Erro ${response.status}: ${errorText}`);
      
      // Informações adicionais para diagnóstico em caso de erro 401
      if (response.status === 401) {
        console.error('[testApiKey] Erro de autenticação (401) detectado');
        console.error('[testApiKey] Verifique:');
        console.error('  1. Se a chave está correta e sem caracteres extras');
        console.error(`  2. Se o ambiente está correto (usando ${isSandbox ? 'sandbox' : 'produção'})`);
        console.error('  3. Se a chave tem permissões para os endpoints necessários');
      }
      
      return {
        success: false,
        status: response.status,
        message: `Erro na API: ${response.statusText}`,
        error: errorText
      };
    }
  } catch (error: any) {
    console.error('[testApiKey] Erro ao testar chave API:', error);
    return {
      success: false,
      message: 'Erro ao testar chave API',
      error: error.message
    };
  }
}

/**
 * Testa a criação de um cliente para validar permissões completas da chave
 * @param apiKey Chave API a ser testada
 * @param isSandbox Se deve testar em ambiente sandbox
 * @returns Resultado do teste
 */
export async function testCustomerCreation(apiKey: string, isSandbox: boolean): Promise<ApiTestResult> {
  try {
    const baseUrl = isSandbox 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/api/v3';
      
    const url = `${baseUrl}/customers`;
    
    // Sanitizar a chave
    const sanitizedKey = apiKey.trim();
    
    // Dados de cliente de teste
    const testCustomer = {
      name: `Teste Automatizado ${new Date().toISOString()}`,
      cpfCnpj: '12345678909', // CPF fictício para teste
      email: 'teste@automatizado.com'
    };
    
    console.log(`[testCustomerCreation] Testando criação de cliente com chave API ${isSandbox ? 'sandbox' : 'produção'}`);
    console.log(`[testCustomerCreation] URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sanitizedKey}`,
        'User-Agent': 'Mozilla/5.0 Lovable/1.0'
      },
      body: JSON.stringify(testCustomer)
    });
    
    console.log(`[testCustomerCreation] Status da resposta: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[testCustomerCreation] Cliente de teste criado com sucesso!');
      return {
        success: true,
        status: response.status,
        data
      };
    } else {
      const errorText = await response.text();
      console.error(`[testCustomerCreation] Erro ${response.status}: ${errorText}`);
      
      return {
        success: false,
        status: response.status,
        message: `Erro na criação de cliente: ${response.statusText}`,
        error: errorText
      };
    }
  } catch (error: any) {
    console.error('[testCustomerCreation] Erro ao testar criação de cliente:', error);
    return {
      success: false,
      message: 'Erro ao testar criação de cliente',
      error: error.message
    };
  }
}

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
    
    // Testar comunicação com a API
    const testResult = await testApiKey(apiKey, isSandbox);
    
    // Se o teste básico falhou, retornar as informações de diagnóstico
    if (!testResult.success) {
      return {
        ...testResult,
        data: {
          ...testResult.data,
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
    
    // Se o teste básico passou, testar a criação de um cliente
    const customerTest = await testCustomerCreation(apiKey, isSandbox);
    
    return {
      success: customerTest.success,
      status: customerTest.status,
      message: customerTest.success 
        ? 'Chave API validada com sucesso, todas as permissões OK' 
        : 'Chave API pode estar com permissões limitadas',
      data: {
        ...customerTest.data,
        diagnostic: keyInfo,
        basicTest: testResult.success,
        environmentVariable: USE_ASAAS_PRODUCTION
      }
    };
  } catch (error: any) {
    console.error('[diagnoseApiKey] Erro durante diagnóstico:', error);
    return {
      success: false,
      message: 'Erro ao realizar diagnóstico da chave API',
      error: error.message
    };
  }
}
