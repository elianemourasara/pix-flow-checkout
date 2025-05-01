
import * as https from 'https';
import fetch from 'node-fetch';
import { getAsaasApiBaseUrl } from './get-asaas-api-base-url';

/**
 * Interface para os resultados dos testes de diagnóstico
 */
interface DiagnosticResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  headers?: Record<string, string>;
  error?: string;
  details?: any;
}

/**
 * Interface para as opções de diagnóstico
 */
interface DiagnosticOptions {
  apiKey: string;
  isSandbox: boolean;
  endpoint?: string;
  method?: string;
  body?: any;
  agent?: https.Agent;
  timeout?: number;
  extraHeaders?: Record<string, string>;
}

/**
 * Função para detectar e remover caracteres invisíveis de uma string
 */
export function detectInvisibleCharacters(text: string): {
  cleanText: string;
  detectedChars: {position: number; charCode: number; description: string}[];
} {
  const detectedChars: {position: number; charCode: number; description: string}[] = [];
  
  // Verificar caracteres invisíveis comuns
  const invisibleChars = [
    { regex: /[\r\n]/g, description: 'quebra de linha' },
    { regex: /\t/g, description: 'tab' },
    { regex: /\s/g, description: 'espaço em branco' },
    { regex: /[\u200B-\u200D\uFEFF]/g, description: 'caractere unicode invisível' }
  ];
  
  let cleanText = text;
  
  // Detectar cada tipo de caractere invisível
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    
    // Verificar se é um caractere invisível
    if (charCode < 32 || // Caracteres de controle
        (charCode >= 127 && charCode <= 159) || // Caracteres de controle estendidos
        (charCode >= 0x200B && charCode <= 0x200D) || // Zero-width characters
        charCode === 0xFEFF || // BOM
        charCode === 0x00A0) { // Non-breaking space
      
      let description = 'caractere de controle';
      if (charCode === 10) description = 'quebra de linha (LF)';
      else if (charCode === 13) description = 'retorno de carro (CR)';
      else if (charCode === 9) description = 'tab';
      else if (charCode === 32) description = 'espaço';
      else if (charCode === 0xFEFF) description = 'BOM';
      else if (charCode === 0x00A0) description = 'espaço não-quebrável';
      else if (charCode >= 0x200B && charCode <= 0x200D) description = 'caractere zero-width';
      
      detectedChars.push({
        position: i,
        charCode,
        description
      });
    }
  }
  
  // Limpar todos os caracteres invisíveis
  for (const { regex } of invisibleChars) {
    cleanText = cleanText.replace(regex, '');
  }
  
  return { cleanText, detectedChars };
}

/**
 * Função para sanitizar uma chave API, removendo caracteres problemáticos
 * e normalizando o formato
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  // Remover espaços, quebras de linha e aspas
  let sanitized = apiKey
    .trim()
    .replace(/[\r\n\t]/g, '')
    .replace(/["']/g, '')
    .replace(/\s/g, '');
  
  // Normalizar o formato para garantir que comece com $aact_
  if (sanitized.includes('aact_') && !sanitized.includes('$aact_')) {
    sanitized = sanitized.replace('aact_', '$aact_');
  }
  
  return sanitized;
}

/**
 * Função para analisar profundamente caracteres especiais e formato da chave API
 */
export function analyzeApiKey(apiKey: string): {
  valid: boolean;
  format: string;
  length: number;
  startsWithAact: boolean;
  hasPrefixDollar: boolean;
  containsInvisibleChars: boolean;
  invisibleChars: {position: number; charCode: number; description: string}[];
  containsQuotes: boolean;
  firstEight: string;
  lastFour: string;
  recommendedAction?: string;
} {
  const { cleanText, detectedChars } = detectInvisibleCharacters(apiKey);
  
  // Verificar formato básico da chave
  const startsWithAact = apiKey.includes('aact_');
  const hasPrefixDollar = apiKey.includes('$aact_');
  const containsQuotes = apiKey.includes('"') || apiKey.includes("'");
  
  // Determinar o formato geral (pattern)
  let format = 'desconhecido';
  if (hasPrefixDollar) format = '$aact_...';
  else if (startsWithAact) format = 'aact_...';
  
  // Determinar ação recomendada com base nos problemas detectados
  let recommendedAction = undefined;
  
  if (containsInvisibleChars) {
    recommendedAction = "Remover caracteres invisíveis da chave API usando o método sanitizeApiKey";
  } else if (containsQuotes) {
    recommendedAction = "Remover aspas da chave API";
  } else if (!hasPrefixDollar && startsWithAact) {
    recommendedAction = "Adicionar o prefixo $ à chave API (deve ser $aact_)";
  } else if (apiKey.length < 30) {
    recommendedAction = "A chave parece incompleta ou inválida. Gere uma nova chave no painel do Asaas";
  }
  
  return {
    valid: hasPrefixDollar && apiKey.length >= 30 && !containsQuotes && detectedChars.length === 0,
    format,
    length: apiKey.length,
    startsWithAact,
    hasPrefixDollar,
    containsInvisibleChars: detectedChars.length > 0,
    invisibleChars: detectedChars,
    containsQuotes,
    firstEight: apiKey.substring(0, 8),
    lastFour: apiKey.substring(apiKey.length - 4),
    recommendedAction
  };
}

/**
 * Função para testar uma chamada HTTP simples para a API Asaas
 * usando a configuração mais básica possível
 */
export async function testMinimalHttpCall(apiKey: string, isSandbox: boolean): Promise<{
  success: boolean;
  status?: number;
  response?: string;
  error?: string;
}> {
  const apiBaseUrl = getAsaasApiBaseUrl(isSandbox);
  const url = `${apiBaseUrl}/status`;
  
  try {
    // Sanitizar a chave e montar o header de autorização
    const sanitizedKey = sanitizeApiKey(apiKey);
    const authHeader = `Bearer ${sanitizedKey}`;
    
    // Usar a API http/https nativa do Node para máximo controle
    const https = await import('https');
    
    return new Promise((resolve) => {
      const req = https.request(
        url,
        {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          timeout: 10000,
        },
        (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            resolve({
              success: res.statusCode === 200,
              status: res.statusCode,
              response: data
            });
          });
        }
      );
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Timeout'
        });
      });
      
      req.end();
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Realiza um teste completo de conexão com a API do Asaas
 */
export async function runApiDiagnostic(options: DiagnosticOptions): Promise<DiagnosticResult> {
  const { 
    apiKey, 
    isSandbox, 
    endpoint = '/customers?limit=1',
    method = 'GET',
    body,
    timeout = 30000,
    extraHeaders = {}
  } = options;
  
  // Inicializar resultado
  const result: DiagnosticResult = {
    success: false
  };
  
  try {
    // Analisar a chave API
    const keyAnalysis = analyzeApiKey(apiKey);
    console.log('[ApiDiagnostic] Análise da chave API:', JSON.stringify({
      ...keyAnalysis,
      // Não incluir a chave completa nos logs
      firstEight: keyAnalysis.firstEight,
      lastFour: keyAnalysis.lastFour
    }, null, 2));
    
    // Se a chave tiver problemas graves, retornar erro
    if (keyAnalysis.containsInvisibleChars) {
      console.warn('[ApiDiagnostic] ALERTA: Caracteres invisíveis detectados na chave API!');
      result.details = { keyAnalysis };
      result.error = 'A chave API contém caracteres invisíveis que podem causar falhas de autenticação';
      return result;
    }
    
    if (keyAnalysis.containsQuotes) {
      console.warn('[ApiDiagnostic] ALERTA: A chave API contém aspas que devem ser removidas!');
      result.details = { keyAnalysis };
      result.error = 'A chave API contém aspas que devem ser removidas';
      return result;
    }
    
    // Sanitizar a chave (remover caracteres problemáticos)
    const sanitizedKey = sanitizeApiKey(apiKey);
    
    // Verificar se a sanitização alterou a chave
    if (sanitizedKey !== apiKey) {
      console.log('[ApiDiagnostic] A chave foi sanitizada:', {
        original: apiKey.substring(0, 8) + '...',
        sanitized: sanitizedKey.substring(0, 8) + '...',
        originalLength: apiKey.length,
        sanitizedLength: sanitizedKey.length
      });
    }
    
    // Montar o URL da API
    const apiBaseUrl = getAsaasApiBaseUrl(isSandbox);
    const url = `${apiBaseUrl}${endpoint}`;
    console.log(`[ApiDiagnostic] Testando conexão com: ${url}`);
    
    // Montar o header de autorização
    const authHeader = `Bearer ${sanitizedKey}`;
    console.log(`[ApiDiagnostic] Authorization header (parcial): Bearer ${sanitizedKey.substring(0, 8)}...${sanitizedKey.substring(sanitizedKey.length - 4)}`);
    console.log(`[ApiDiagnostic] Comprimento do header: ${authHeader.length} caracteres`);
    
    // Criar agente HTTPS com configurações personalizadas
    const agent = options.agent || new https.Agent({
      rejectUnauthorized: true,
      keepAlive: true,
      timeout
    });
    
    // Headers padrão
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'User-Agent': 'Mozilla/5.0 Diagnostic/1.0',
      'Accept': '*/*',
      'Cache-Control': 'no-cache',
      ...extraHeaders
    };
    
    console.log(`[ApiDiagnostic] Headers da requisição:`, JSON.stringify(headers, (key, value) => {
      // Ocultar o valor completo da chave API nos logs
      if (key === 'Authorization') {
        return `Bearer ${sanitizedKey.substring(0, 8)}...${sanitizedKey.substring(sanitizedKey.length - 4)}`;
      }
      return value;
    }, 2));
    
    // Configurar a requisição
    const fetchOptions: any = {
      method,
      headers,
      // @ts-ignore - Tipagem incompatível entre node-fetch e fetch nativo
      agent,
      timeout
    };
    
    // Adicionar corpo se necessário
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(body);
    }
    
    // Executar a requisição
    console.log(`[ApiDiagnostic] Enviando requisição ${method} para ${url}...`);
    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const endTime = Date.now();
    console.log(`[ApiDiagnostic] Tempo de resposta: ${endTime - startTime}ms`);
    
    // Coletar headers da resposta
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log(`[ApiDiagnostic] Headers da resposta:`, JSON.stringify(responseHeaders, null, 2));
    
    // Coletar corpo da resposta
    let responseText = '';
    try {
      responseText = await response.text();
      console.log(`[ApiDiagnostic] Corpo da resposta (parcial): ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
    } catch (e) {
      console.error('[ApiDiagnostic] Erro ao ler corpo da resposta:', e);
    }
    
    // Montar resultado
    result.success = response.ok;
    result.statusCode = response.status;
    result.response = responseText;
    result.headers = responseHeaders;
    result.details = {
      url,
      method,
      requestHeaders: headers,
      responseTime: endTime - startTime,
      keyAnalysis
    };
    
    // Log final do resultado
    console.log(`[ApiDiagnostic] Teste concluído. Status: ${response.status} ${response.statusText}. Sucesso: ${result.success}`);
    
    return result;
    
  } catch (error: any) {
    console.error('[ApiDiagnostic] Erro durante diagnóstico:', error);
    
    // Montar resposta de erro
    result.error = error.message || 'Erro desconhecido durante diagnóstico';
    result.details = {
      errorName: error.name,
      errorStack: error.stack?.substring(0, 300)
    };
    
    return result;
  }
}

/**
 * Executar múltiplos testes de diagnóstico com diferentes configurações
 */
export async function runComprehensiveDiagnostics(apiKey: string, isSandbox: boolean): Promise<{
  results: Record<string, DiagnosticResult>;
  summary: {
    allFailed: boolean;
    anySuccess: boolean;
    recommendedAction: string;
    possibleIssues: string[];
  };
}> {
  const results: Record<string, DiagnosticResult> = {};
  
  // Primeiro, vamos tentar uma chamada HTTP nativa mais simples possível
  const minimalTest = await testMinimalHttpCall(sanitizeApiKey(apiKey), isSandbox);
  results.minimalHttps = {
    success: minimalTest.success,
    statusCode: minimalTest.status,
    response: minimalTest.response,
    error: minimalTest.error
  };
  
  // Teste 1: Configuração padrão
  results.standard = await runApiDiagnostic({
    apiKey: sanitizeApiKey(apiKey),
    isSandbox,
    endpoint: '/status'
  });
  
  // Teste 2: Com User-Agent diferente
  results.differentUserAgent = await runApiDiagnostic({
    apiKey: sanitizeApiKey(apiKey),
    isSandbox,
    endpoint: '/status',
    extraHeaders: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  // Teste 3: Com IPv4 forçado
  const ipv4Agent = new https.Agent({
    family: 4,
    rejectUnauthorized: true,
    keepAlive: true
  });
  
  results.ipv4Only = await runApiDiagnostic({
    apiKey: sanitizeApiKey(apiKey),
    isSandbox,
    endpoint: '/status',
    agent: ipv4Agent
  });
  
  // Teste 4: Sem headers extras
  results.minimalHeaders = await runApiDiagnostic({
    apiKey: sanitizeApiKey(apiKey),
    isSandbox,
    endpoint: '/status',
    extraHeaders: {
      'User-Agent': undefined,
      'Accept': undefined,
      'Cache-Control': undefined
    }
  });
  
  // Teste 5: Com timeout maior
  results.extendedTimeout = await runApiDiagnostic({
    apiKey: sanitizeApiKey(apiKey),
    isSandbox,
    endpoint: '/status',
    timeout: 60000
  });
  
  // Analisar resultados
  const anySuccess = Object.values(results).some(r => r.success);
  const allFailed = Object.values(results).every(r => !r.success);
  
  // Identificar possíveis problemas
  const possibleIssues: string[] = [];
  
  if (allFailed) {
    if (Object.values(results).every(r => r.statusCode === 401)) {
      possibleIssues.push('A chave API parece inválida ou expirada. Verificar se foi revogada no painel do Asaas.');
      possibleIssues.push('A chave API pode não ter as permissões necessárias para acessar o endpoint.');
    }
    
    if (Object.values(results).some(r => r.error?.includes('timeout'))) {
      possibleIssues.push('Há problemas de conectividade ou latência alta com a API do Asaas.');
    }
    
    if (Object.values(results).some(r => r.statusCode === 403)) {
      possibleIssues.push('O IP do servidor pode estar bloqueado pelo Asaas.');
    }
    
    // Verificar se algum teste retornou CloudFront nos headers
    const hasCloudFrontIssue = Object.values(results).some(
      r => r.headers && (r.headers['x-cache']?.includes('cloudfront') || r.headers['via']?.includes('cloudfront'))
    );
    
    if (hasCloudFrontIssue) {
      possibleIssues.push('Detectados headers CloudFront. Pode haver um problema de proxy ou CDN afetando a autenticação.');
    }
    
    // Novos testes para o problema específico
    const analyzedKey = analyzeApiKey(apiKey);
    if (!analyzedKey.valid && analyzedKey.recommendedAction) {
      possibleIssues.push(`Problema na formatação da chave API: ${analyzedKey.recommendedAction}`);
    }
  } else if (results.differentUserAgent.success && !results.standard.success) {
    possibleIssues.push('O User-Agent padrão pode estar sendo bloqueado. Considere usar um User-Agent diferente.');
  } else if (results.ipv4Only.success && !results.standard.success) {
    possibleIssues.push('Pode haver problemas com a resolução de IPv6. Considere forçar IPv4.');
  }
  
  // Determinar ação recomendada
  let recommendedAction = 'Verificar permissões da chave API no painel do Asaas e considerar gerar uma nova chave.';
  
  if (anySuccess) {
    const successTest = Object.entries(results).find(([_, r]) => r.success);
    recommendedAction = `Usar a configuração do teste "${successTest?.[0]}" que foi bem-sucedido.`;
  } else {
    if (possibleIssues.some(issue => issue.includes('CloudFront'))) {
      recommendedAction = 'Verificar se há alguma configuração de proxy ou CDN na sua função Netlify que possa estar afetando os headers de autorização.';
    }
    
    if (possibleIssues.some(issue => issue.includes('formatação da chave'))) {
      recommendedAction = 'Corrija a formatação da chave API conforme a análise sugere e regenere a chave no painel do Asaas se necessário.';
    }
  }
  
  return {
    results,
    summary: {
      allFailed,
      anySuccess,
      recommendedAction,
      possibleIssues
    }
  };
}

/**
 * Função de diagnóstico para chamadas HTTP no ambiente Netlify
 */
export async function diagnoseDependencyIssues(): Promise<{
  fetchAvailable: boolean;
  httpsAvailable: boolean;
  agentWorks: boolean;
  corsHeadersWork: boolean;
  environmentVariables: Record<string, string | undefined>;
  netlifyInfo?: Record<string, string | undefined>;
}> {
  const result = {
    fetchAvailable: false,
    httpsAvailable: false,
    agentWorks: false,
    corsHeadersWork: false,
    environmentVariables: {
      NODE_VERSION: process.env.NODE_VERSION,
      NODE_ENV: process.env.NODE_ENV,
      NETLIFY: process.env.NETLIFY,
      CONTEXT: process.env.CONTEXT,
      USE_ASAAS_PRODUCTION: process.env.USE_ASAAS_PRODUCTION
    },
    netlifyInfo: {
      NETLIFY_DEV: process.env.NETLIFY_DEV,
      NETLIFY_FUNCTIONS_URL: process.env.NETLIFY_FUNCTIONS_URL,
      DEPLOY_URL: process.env.DEPLOY_URL,
      DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
      URL: process.env.URL
    }
  };
  
  // Verificar disponibilidade do fetch
  try {
    await fetch('https://api.asaas.com/api/v3/status');
    result.fetchAvailable = true;
  } catch (e) {
    console.error('[diagnoseDependencyIssues] Erro ao testar fetch:', e);
  }
  
  // Verificar disponibilidade do https
  try {
    const agent = new https.Agent({
      rejectUnauthorized: true
    });
    result.httpsAvailable = true;
    
    // Testar se o agent funciona
    try {
      await fetch('https://api.asaas.com/api/v3/status', {
        // @ts-ignore - Tipagem incompatível
        agent
      });
      result.agentWorks = true;
    } catch (e) {
      console.error('[diagnoseDependencyIssues] Erro ao testar agent:', e);
    }
  } catch (e) {
    console.error('[diagnoseDependencyIssues] Erro ao testar https:', e);
  }
  
  // Verificar se os headers CORS funcionam
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    };
    
    await fetch('https://api.asaas.com/api/v3/status', {
      headers: corsHeaders
    });
    
    result.corsHeadersWork = true;
  } catch (e) {
    console.error('[diagnoseDependencyIssues] Erro ao testar CORS headers:', e);
  }
  
  return result;
}
