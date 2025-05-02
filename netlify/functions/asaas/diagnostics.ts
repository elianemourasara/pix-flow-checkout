
import * as https from 'https';

interface ApiKeyAnalysis {
  valid: boolean;
  format: string;
  length: number;
  hasPrefixDollar: boolean;
  firstEight: string;
  lastFour: string;
  fullKey?: string;
  containsInvisibleChars: boolean;
  containsQuotes: boolean;
  recommendedAction?: string;
}

interface DiagnosticResult {
  success: boolean;
  statusCode?: number;
  headers?: Record<string, string>;
  response?: string;
  error?: string;
}

interface DiagnosticReport {
  summary: {
    success: boolean;
    message: string;
    environment: string;
    keyFormat: boolean;
    connectivity: boolean;
    authentication: boolean;
  };
  results: Record<string, DiagnosticResult>;
}

/**
 * Analisa uma chave API para identificar problemas
 * @param apiKey Chave API a ser analisada
 * @returns Análise da chave
 */
export function analyzeApiKey(apiKey: string): ApiKeyAnalysis {
  if (!apiKey) {
    return {
      valid: false,
      format: 'vazia',
      length: 0,
      hasPrefixDollar: false,
      firstEight: '',
      lastFour: '',
      containsInvisibleChars: false,
      containsQuotes: false,
      recommendedAction: 'Forneça uma chave API válida no formato $aact_*'
    };
  }
  
  const firstEight = apiKey.length >= 8 ? apiKey.substring(0, 8) : apiKey;
  const lastFour = apiKey.length >= 4 ? apiKey.substring(apiKey.length - 4) : apiKey;
  
  const hasPrefixDollar = apiKey.startsWith('$');
  const hasPrefixAact = apiKey.startsWith('$aact_');
  const containsInvisibleChars = /[\u200B-\u200D\uFEFF\s]/.test(apiKey);
  const containsQuotes = apiKey.includes('"') || apiKey.includes("'");
  
  let format = 'desconhecido';
  let recommendedAction = undefined;
  
  if (!hasPrefixDollar) {
    format = 'sem $ inicial';
    recommendedAction = 'A chave deve começar com $aact_';
  } else if (!hasPrefixAact) {
    format = 'sem prefixo $aact_';
    recommendedAction = 'Verifique se a chave está no formato $aact_*';
  } else if (apiKey.length < 30) {
    format = 'muito curta';
    recommendedAction = 'A chave parece estar incompleta';
  } else if (containsInvisibleChars) {
    format = 'contém caracteres invisíveis';
    recommendedAction = 'Remova espaços e caracteres invisíveis da chave';
  } else if (containsQuotes) {
    format = 'contém aspas';
    recommendedAction = 'Remova as aspas da chave';
  } else {
    format = 'aparentemente válida';
  }
  
  return {
    valid: hasPrefixAact && !containsInvisibleChars && !containsQuotes && apiKey.length > 30,
    format,
    length: apiKey.length,
    hasPrefixDollar,
    firstEight,
    lastFour,
    fullKey: apiKey, // Apenas para diagnóstico, remova em produção
    containsInvisibleChars,
    containsQuotes,
    recommendedAction
  };
}

/**
 * Limpa a chave API removendo caracteres problemáticos
 * @param apiKey Chave API a ser sanitizada
 * @returns Chave API limpa
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  // Remover espaços, quebras de linha e caracteres invisíveis
  return apiKey
    .trim()
    .replace(/[\n\r\t\s]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/**
 * Teste HTTP simples para diagnóstico básico
 * @param apiKey Chave API sanitizada
 * @param isSandbox Se deve usar ambiente sandbox
 * @returns Resultado do teste
 */
export async function testMinimalHttpCall(apiKey: string, isSandbox: boolean): Promise<DiagnosticResult> {
  try {
    const baseUrl = isSandbox 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/api/v3';
      
    // Use require for node-fetch to ensure compatibility
    const fetch = require('node-fetch');
    
    const response = await fetch(`${baseUrl}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Mozilla/5.0 Lovable/Diagnostics'
      }
    });
    
    const responseText = await response.text();
    
    return {
      success: response.ok,
      statusCode: response.status,
      response: responseText
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verifica problemas com dependências
 * @returns Resultados do diagnóstico
 */
export async function diagnoseDependencyIssues(): Promise<Record<string, any>> {
  const results = {
    nodeFetch: {
      available: false,
      version: null,
      error: null
    },
    nativeFetch: {
      available: false,
      error: null
    },
    https: {
      available: !!https,
      agent: false,
      error: null
    }
  };
  
  // Verificar node-fetch
  try {
    const nodeFetch = require('node-fetch');
    results.nodeFetch.available = true;
    results.nodeFetch.version = nodeFetch?.default?.version || 'desconhecida';
  } catch (error) {
    results.nodeFetch.error = error.message;
  }
  
  // Verificar fetch nativo
  try {
    results.nativeFetch.available = typeof fetch !== 'undefined';
  } catch (error) {
    results.nativeFetch.error = error.message;
  }
  
  // Verificar agent HTTPS
  try {
    new https.Agent({});
    results.https.agent = true;
  } catch (error) {
    results.https.error = error.message;
  }
  
  return results;
}

/**
 * Executa diagnóstico completo da integração com Asaas
 * @param apiKey Chave API a ser testada
 * @param isSandbox Se deve usar ambiente sandbox
 * @returns Relatório de diagnóstico
 */
export async function runComprehensiveDiagnostics(apiKey: string, isSandbox: boolean): Promise<DiagnosticReport> {
  const baseUrl = isSandbox 
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/api/v3';
    
  const sanitizedKey = sanitizeApiKey(apiKey);
  const keyAnalysis = analyzeApiKey(sanitizedKey);
  
  const results: Record<string, DiagnosticResult> = {};
  
  // Teste básico de conectividade
  try {
    // Use require for node-fetch to ensure compatibility
    const fetch = require('node-fetch');
    
    // Configurar agent HTTPS para diagnosticos avançados
    const agent = new https.Agent({
      rejectUnauthorized: true,
      keepAlive: true,
      timeout: 30000
    });
    
    // Teste 1: Status endpoint sem autenticação
    try {
      const statusResponse = await fetch(`${baseUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        agent
      });
      
      const statusText = await statusResponse.text();
      
      results.connectivityTest = {
        success: statusResponse.status < 500, // Mesmo com 401, a conectividade funciona
        statusCode: statusResponse.status,
        headers: Object.fromEntries([...statusResponse.headers]),
        response: statusText
      };
    } catch (error) {
      results.connectivityTest = {
        success: false,
        error: error.message
      };
    }
    
    // Teste 2: Status com autenticação
    try {
      const authResponse = await fetch(`${baseUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sanitizedKey}`,
          'User-Agent': 'Mozilla/5.0 Lovable/Diagnostics'
        },
        agent
      });
      
      const authText = await authResponse.text();
      
      results.authenticationTest = {
        success: authResponse.ok,
        statusCode: authResponse.status,
        headers: Object.fromEntries([...authResponse.headers]),
        response: authText
      };
    } catch (error) {
      results.authenticationTest = {
        success: false,
        error: error.message
      };
    }
    
    // Teste 3: Criação de cliente (teste de permissões)
    if (keyAnalysis.valid) {
      try {
        const customerResponse = await fetch(`${baseUrl}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sanitizedKey}`,
            'User-Agent': 'Mozilla/5.0 Lovable/Diagnostics'
          },
          body: JSON.stringify({
            name: `Diagnóstico ${new Date().toISOString()}`,
            cpfCnpj: '12345678909', // CPF fictício para teste
            email: 'diagnostico@teste.com'
          }),
          agent
        });
        
        const customerText = await customerResponse.text();
        
        results.customerTest = {
          success: customerResponse.ok,
          statusCode: customerResponse.status,
          headers: Object.fromEntries([...customerResponse.headers]),
          response: customerText
        };
      } catch (error) {
        results.customerTest = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Verificar variáveis de ambiente
    const envSummary = {
      USE_ASAAS_PRODUCTION: process.env.USE_ASAAS_PRODUCTION,
      isSandbox,
      isMismatch: (process.env.USE_ASAAS_PRODUCTION === 'true') !== !isSandbox
    };
    
    results.environmentCheck = {
      success: !envSummary.isMismatch,
      response: JSON.stringify(envSummary)
    };
    
  } catch (error) {
    results.generalError = {
      success: false,
      error: error.message
    };
  }
  
  // Calcular resumo do diagnóstico
  const summary = {
    success: results.authenticationTest?.success || false,
    message: results.authenticationTest?.success 
      ? 'API Asaas funcionando corretamente' 
      : results.authenticationTest?.statusCode === 401 
        ? 'Erro de autenticação (401) - Chave API inválida ou sem permissões'
        : 'Falha na conexão com API do Asaas',
    environment: isSandbox ? 'SANDBOX' : 'PRODUÇÃO',
    keyFormat: keyAnalysis.valid,
    connectivity: results.connectivityTest?.success || false,
    authentication: results.authenticationTest?.success || false
  };
  
  return { summary, results };
}
