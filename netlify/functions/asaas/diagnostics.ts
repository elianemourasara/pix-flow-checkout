
/**
 * Funções para diagnóstico e sanitização da integração com o Asaas
 */
import * as https from 'https';

/**
 * Sanitiza uma chave API, removendo caracteres invisíveis, aspas e espaços
 * @param apiKey Chave API a ser sanitizada
 * @returns Chave sanitizada
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  // 1. Remover aspas (simples e duplas) que podem ter sido incluídas acidentalmente
  let sanitized = apiKey.replace(/['"]/g, '');
  
  // 2. Remover caracteres invisíveis e espaços
  sanitized = sanitized.replace(/\s+/g, '');
  
  // 3. Remover outros caracteres invisíveis específicos (BOM, quebras de linha, etc.)
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, '');
  
  return sanitized;
}

/**
 * Analisa uma chave API do Asaas, verificando seu formato e possíveis problemas
 * @param apiKey Chave API para análise
 * @returns Objeto com informações detalhadas da análise
 */
export function analyzeApiKey(apiKey: string): {
  valid: boolean;
  format: string;
  length: number;
  firstEight: string;
  lastFour: string;
  startsWithAact: boolean;
  hasPrefixDollar: boolean;
  containsInvisibleChars: boolean;
  invisibleChars?: string[];
  containsQuotes: boolean;
  recommendedAction?: string;
} {
  if (!apiKey) {
    return {
      valid: false,
      format: 'empty',
      length: 0,
      firstEight: '',
      lastFour: '',
      startsWithAact: false,
      hasPrefixDollar: false,
      containsInvisibleChars: false,
      containsQuotes: false,
      recommendedAction: 'Forneça uma chave API válida'
    };
  }
  
  // Verificar formato básico da chave
  const hasPrefixDollar = apiKey.startsWith('$');
  const startsWithAact = apiKey.includes('aact_');
  const correctStart = apiKey.startsWith('$aact_');
  
  // Verificar caracteres problemáticos
  const containsQuotes = apiKey.includes('"') || apiKey.includes("'");
  
  // Detecção de caracteres invisíveis
  const originalLength = apiKey.length;
  const sanitized = sanitizeApiKey(apiKey);
  const sanitizedLength = sanitized.length;
  const containsInvisibleChars = originalLength !== sanitizedLength;
  
  // Detectar quais caracteres invisíveis existem
  const invisibleChars: string[] = [];
  if (containsInvisibleChars) {
    // Iterar pelos caracteres para identificar invisíveis por posição
    for (let i = 0; i < apiKey.length; i++) {
      const char = apiKey[i];
      const code = char.charCodeAt(0);
      // Verificar se é um caractere de controle ou espaço invisível
      if (
        (code < 32 && code !== 9 && code !== 10 && code !== 13) || // Controle (exceto tab, LF, CR)
        (code >= 0x200B && code <= 0x200D) || // Zero-width spaces
        code === 0xFEFF || // BOM
        code === 0x00A0 || // Non-breaking space
        code === 0x1680 || // Ogham space mark
        code === 0x180E || // Mongolian vowel separator
        (code >= 0x2000 && code <= 0x200A) || // Em/En spaces
        code === 0x2028 || // Line separator
        code === 0x2029 || // Paragraph separator
        code === 0x202F || // Narrow no-break space
        code === 0x205F || // Medium mathematical space
        code === 0x3000    // Ideographic space
      ) {
        invisibleChars.push(`pos ${i}: U+${code.toString(16).toUpperCase().padStart(4, '0')}`);
      }
    }
  }
  
  // Determinar formato da chave
  let format = 'unknown';
  if (correctStart) {
    format = 'correct';
  } else if (hasPrefixDollar && !startsWithAact) {
    format = 'starts-with-$-only';
  } else if (!hasPrefixDollar && startsWithAact) {
    format = 'starts-with-aact-only';
  } else if (!hasPrefixDollar && !startsWithAact) {
    format = 'no-prefix';
  }

  // Extrair pedaços da chave para identificação segura
  const firstEight = apiKey.substring(0, Math.min(8, apiKey.length));
  const lastFour = apiKey.length >= 4 ? apiKey.substring(apiKey.length - 4) : apiKey;
  
  // Gerar ação recomendada
  let recommendedAction: string | undefined;
  if (containsInvisibleChars) {
    recommendedAction = 'A chave contém caracteres invisíveis que precisam ser removidos. Copie a chave diretamente do painel do Asaas novamente.';
  } else if (containsQuotes) {
    recommendedAction = 'A chave contém aspas que precisam ser removidas.';
  } else if (!correctStart) {
    recommendedAction = 'A chave não segue o formato padrão ($aact_...). Verifique se está usando uma chave API válida do Asaas.';
  } else if (sanitizedLength < 50) {
    recommendedAction = 'A chave parece estar incompleta. Verifique se ela foi copiada integralmente do painel do Asaas.';
  }
  
  // Verificar se a chave parece válida
  const valid = correctStart && !containsInvisibleChars && !containsQuotes && sanitizedLength > 50;
  
  return {
    valid,
    format,
    length: sanitizedLength,
    firstEight,
    lastFour,
    startsWithAact,
    hasPrefixDollar,
    containsInvisibleChars,
    invisibleChars: invisibleChars.length > 0 ? invisibleChars : undefined,
    containsQuotes,
    recommendedAction
  };
}

/**
 * Verifica se há problemas de dependências ou ambiente que possam afetar a integração
 */
export async function diagnoseDependencyIssues() {
  const issues = {
    fetchAvailable: typeof fetch === 'function',
    httpsAvailable: typeof https !== 'undefined',
    agentWorks: false,
    corsHeadersWork: false,
    environmentVariables: {
      USE_ASAAS_PRODUCTION: process.env.USE_ASAAS_PRODUCTION,
      NODE_ENV: process.env.NODE_ENV,
      AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
      NETLIFY: process.env.NETLIFY
    },
    netlifyInfo: {
      SITE_ID: process.env.SITE_ID,
      NETLIFY_LOCAL: process.env.NETLIFY_LOCAL,
      NETLIFY_DEV: process.env.NETLIFY_DEV,
      DEPLOY_ID: process.env.DEPLOY_ID
    }
  };
  
  try {
    // Testar se Agent funciona
    const agent = new https.Agent({
      rejectUnauthorized: true,
      keepAlive: true
    });
    issues.agentWorks = true;
    
    // Testar CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    };
    if (Object.keys(corsHeaders).length > 0) {
      issues.corsHeadersWork = true;
    }
  } catch (error) {
    console.error('[diagnoseDependencies] Erro ao verificar dependências:', error);
  }
  
  return issues;
}

/**
 * Executa testes simples de conexão HTTP usando fetch nativo
 * @param apiKey Chave API para testar
 * @param isSandbox Indicador se deve usar ambiente sandbox
 */
export async function testMinimalHttpCall(apiKey: string, isSandbox: boolean) {
  try {
    const baseUrl = isSandbox 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/api/v3';
      
    const url = `${baseUrl}/status`;
    console.log(`[testMinimalHttpCall] Testando conexão básica em ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Mozilla/5.0 (compatible; AsaasTest/1.0)'
      }
    });
    
    const success = response.ok;
    const status = response.status;
    
    console.log(`[testMinimalHttpCall] Resultado: ${success ? 'Sucesso' : 'Falha'}, status: ${status}`);
    
    const responseText = await response.text();
    return {
      success,
      status,
      response: responseText
    };
  } catch (error: any) {
    console.error('[testMinimalHttpCall] Erro:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Executa um diagnóstico completo da integração com o Asaas
 * @param apiKey Chave API para diagnosticar
 * @param isSandbox Indicador se deve usar ambiente sandbox
 */
export async function runComprehensiveDiagnostics(apiKey: string, isSandbox: boolean) {
  const baseUrl = isSandbox 
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/api/v3';
  
  console.log(`[runComprehensiveDiagnostics] Iniciando diagnóstico com ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);
  console.log(`[runComprehensiveDiagnostics] URL base: ${baseUrl}`);
  
  // Sanitizar a chave para o teste
  const sanitizedKey = sanitizeApiKey(apiKey);
  
  // Resultados de testes
  const results: Record<string, {
    success: boolean;
    statusCode?: number;
    headers?: Record<string, string>;
    response?: string;
    error?: string;
  }> = {};
  
  // Testes a executar
  const tests = [
    {
      name: 'status',
      endpoint: '/status',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sanitizedKey}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'customers_basic',
      endpoint: '/customers?limit=1',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sanitizedKey}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'customers_custom_ua',
      endpoint: '/customers?limit=1',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sanitizedKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    },
    {
      name: 'customers_postman',
      endpoint: '/customers?limit=1',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sanitizedKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.29.0'
      }
    },
    {
      name: 'customers_curl',
      endpoint: '/customers?limit=1',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sanitizedKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'curl/7.64.1'
      }
    }
  ];
  
  // Executar os testes
  for (const test of tests) {
    try {
      console.log(`[runComprehensiveDiagnostics] Executando teste: ${test.name}`);
      
      const url = `${baseUrl}${test.endpoint}`;
      const response = await fetch(url, {
        method: test.method,
        headers: test.headers
      });
      
      const responseText = await response.text();
      const responseHeaders = Object.fromEntries([...response.headers]);
      
      results[test.name] = {
        success: response.ok,
        statusCode: response.status,
        headers: responseHeaders,
        response: responseText
      };
      
      console.log(`[runComprehensiveDiagnostics] ${test.name}: ${response.status} ${response.ok ? 'OK' : 'ERRO'}`);
      
    } catch (error: any) {
      console.error(`[runComprehensiveDiagnostics] Erro no teste ${test.name}:`, error);
      results[test.name] = {
        success: false,
        error: error.message
      };
    }
  }
  
  // Analisar os resultados para fornecer um diagnóstico
  const anySuccess = Object.values(results).some(r => r.success);
  const allFailed = Object.values(results).every(r => !r.success);
  
  // Possíveis problemas e soluções
  const possibleIssues: string[] = [];
  
  if (allFailed) {
    possibleIssues.push('A chave API pode estar inválida ou ter expirado.');
    possibleIssues.push('O ambiente de produção pode estar incorretamente configurado como sandbox.');
    possibleIssues.push('A API do Asaas pode estar bloqueando requisições do seu IP ou servidor.');
  }
  
  // Se alguns testes passaram e outros falharam, analisar os padrões
  if (anySuccess && !allFailed) {
    const userAgentPattern = results.customers_custom_ua?.success || 
                            results.customers_postman?.success || 
                            results.customers_curl?.success;
    
    if (userAgentPattern && !results.customers_basic?.success) {
      possibleIssues.push('A API do Asaas parece estar filtrando por User-Agent. Tente usar um User-Agent diferente.');
    }
  }
  
  let recommendedAction = 'Nenhuma ação necessária, testes bem-sucedidos.';
  
  if (allFailed) {
    recommendedAction = 'Gere uma nova chave API no painel do Asaas e atualize no Supabase. Verifique se o ambiente de execução está configurado corretamente.';
  } else if (!results.customers_basic?.success) {
    recommendedAction = 'Tente modificar os headers da requisição, especialmente o User-Agent.';
  }
  
  // Resumo do diagnóstico
  const summary = {
    allFailed,
    anySuccess,
    recommendedAction,
    possibleIssues
  };
  
  return {
    summary,
    results
  };
}
