
import { supabase } from './supabase-client';

/**
 * Cache em memória para chaves API
 */
interface KeyCache {
  sandbox: string | null;
  production: string | null;
  timestamp: number;
}

// Cache com tempo de expiração de 5 minutos
const KEY_CACHE_EXPIRY = 5 * 60 * 1000;
let keyCache: KeyCache = {
  sandbox: null,
  production: null,
  timestamp: 0
};

/**
 * Função para sanitizar chaves API, removendo espaços e caracteres problemáticos
 */
function sanitizeApiKey(key: string): string {
  if (!key) return '';
  
  // Remove espaços no início e fim
  let sanitized = key.trim();
  
  // Remove quebras de linha ou tabs que podem ter sido acidentalmente copiados
  sanitized = sanitized.replace(/[\n\r\t]/g, '');
  
  // Verifica caracteres Unicode que não são visíveis mas poderiam estar presentes
  const invisibleChars = /[\u200B-\u200D\uFEFF]/g;
  if (invisibleChars.test(sanitized)) {
    console.warn('[sanitizeApiKey] ALERTA: Caracteres unicode invisíveis detectados e removidos');
    sanitized = sanitized.replace(invisibleChars, '');
  }
  
  // Remove espaços internos que possam existir
  if (sanitized.includes(' ')) {
    console.warn('[sanitizeApiKey] ALERTA: Espaços internos detectados na chave API e removidos');
    sanitized = sanitized.replace(/\s/g, '');
  }
  
  // Verifica caracteres problemáticos para autenticação
  const problematicChars = /["'\\<>]/g; 
  if (problematicChars.test(sanitized)) {
    console.warn('[sanitizeApiKey] ALERTA: Caracteres problemáticos encontrados na chave API');
  }
  
  return sanitized;
}

/**
 * Função robusta para obter chave da API Asaas
 * Implementa cache em memória e mecanismo de fallback
 * 
 * IMPORTANTE: Esta função respeita a variável de ambiente USE_ASAAS_PRODUCTION
 * Se USE_ASAAS_PRODUCTION=true, sempre retornará uma chave de produção
 * Se USE_ASAAS_PRODUCTION=false ou não definida, sempre retornará uma chave sandbox
 */
export async function getAsaasApiKey(isSandboxParam?: boolean): Promise<string | null> {
  console.log('==================== INÍCIO DA OPERAÇÃO getAsaasApiKey ====================');
  
  // Determinar se devemos usar sandbox baseado na variável de ambiente
  // Esta configuração tem precedência sobre o parâmetro
  const useProductionEnvRaw = process.env.USE_ASAAS_PRODUCTION;
  const useProductionEnv = useProductionEnvRaw === 'true';
  
  console.log(`[getAsaasApiKey] Valor bruto da variável USE_ASAAS_PRODUCTION: "${useProductionEnvRaw}"`);
  console.log(`[getAsaasApiKey] Interpretado como: ${useProductionEnv ? 'PRODUÇÃO' : 'SANDBOX'}`);
  
  // Se a variável de ambiente está definida, usamos ela para determinar o ambiente
  // Caso contrário, usamos o parâmetro fornecido ou padrão para sandbox
  const isSandbox = useProductionEnv ? false : (isSandboxParam !== undefined ? isSandboxParam : true);
  
  console.log(`[getAsaasApiKey] Ambiente determinado pelo USE_ASAAS_PRODUCTION=${useProductionEnvRaw}`);
  console.log(`[getAsaasApiKey] Valor de useProductionEnv: ${useProductionEnv}`);
  console.log(`[getAsaasApiKey] Obtendo chave Asaas para ambiente ${isSandbox ? 'sandbox' : 'produção'}`);
  
  try {
    // Verificar cache
    const now = Date.now();
    if (now - keyCache.timestamp < KEY_CACHE_EXPIRY) {
      const cachedKey = isSandbox ? keyCache.sandbox : keyCache.production;
      if (cachedKey) {
        console.log(`[getAsaasApiKey] Usando chave ${isSandbox ? 'sandbox' : 'produção'} do cache`);
        
        // Sanitizar a chave antes de retornar, mesmo do cache
        const sanitizedKey = sanitizeApiKey(cachedKey);
        
        // Exibir primeiros caracteres da chave para validação nos logs
        console.log(`[getAsaasApiKey] Chave em cache (primeiros caracteres): ${sanitizedKey.substring(0, 8)}...`);
        console.log(`[getAsaasApiKey] Chave em cache (últimos caracteres): ...${sanitizedKey.substring(sanitizedKey.length - 4)}`);
        console.log(`[getAsaasApiKey] Comprimento da chave em cache: ${sanitizedKey.length} caracteres`);
        console.log('==================== FIM DA OPERAÇÃO getAsaasApiKey (do cache) ====================');
        return sanitizedKey;
      }
    }
    
    // 1. Primeiro tenta obter do sistema novo (asaas_api_keys)
    console.log('[getAsaasApiKey] Tentando obter chave do sistema novo...');
    console.log(`[getAsaasApiKey] Parâmetros da consulta: is_active=true, is_sandbox=${isSandbox}`);
    
    const { data: activeKeys, error: keyError } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('is_active', true)
      .eq('is_sandbox', isSandbox)
      .order('priority', { ascending: true })
      .limit(1);
      
    console.log(`[getAsaasApiKey] Resultado da consulta: encontradas ${activeKeys ? activeKeys.length : 0} chaves`);
    
    if (!keyError && activeKeys && activeKeys.length > 0) {
      // Exibir informações da chave para validação
      console.log(`[getAsaasApiKey] Chave obtida do sistema novo: ${activeKeys[0].key_name} (ID: ${activeKeys[0].id})`);
      console.log(`[getAsaasApiKey] is_active=${activeKeys[0].is_active}, is_sandbox=${activeKeys[0].is_sandbox}`);
      
      const rawKey = activeKeys[0].api_key;
      
      // Verificar se a chave é uma string válida
      if (typeof rawKey !== 'string') {
        console.error(`[getAsaasApiKey] ERRO CRÍTICO: A chave não é uma string válida, é um ${typeof rawKey}`);
        if (rawKey === null) {
          console.error('[getAsaasApiKey] A chave é NULL');
        } else if (rawKey === undefined) {
          console.error('[getAsaasApiKey] A chave é undefined');
        }
        throw new Error('Formato de chave API inválido');
      }
      
      // Sanitizar a chave antes de uso
      const sanitizedKey = sanitizeApiKey(rawKey);
      
      console.log(`[getAsaasApiKey] Primeiros caracteres da chave: ${sanitizedKey.substring(0, 8)}...`);
      console.log(`[getAsaasApiKey] Últimos caracteres da chave: ...${sanitizedKey.substring(sanitizedKey.length - 4)}`);
      console.log(`[getAsaasApiKey] Comprimento da chave: ${sanitizedKey.length} caracteres`);
      console.log(`[getAsaasApiKey] Comprimento original: ${rawKey.length}, Após sanitização: ${sanitizedKey.length}`);
      
      // Verificar formato básico da chave Asaas
      if (!sanitizedKey.startsWith('$aact_')) {
        console.error('[getAsaasApiKey] ALERTA CRÍTICO: A chave não começa com "$aact_", o que é incomum para chaves Asaas');
      }
      
      // Verificar se a sanitização alterou a chave
      if (rawKey !== sanitizedKey) {
        console.warn('[getAsaasApiKey] ALERTA: A chave foi sanitizada, removendo caracteres problemáticos');
        if (rawKey.length !== sanitizedKey.length) {
          console.warn(`[getAsaasApiKey] Diferença de tamanho: ${rawKey.length - sanitizedKey.length} caracteres removidos`);
        }
      }
      
      if (sanitizedKey.length < 30) {
        console.error('[getAsaasApiKey] ALERTA: A chave parece muito curta e pode estar incompleta');
      }
      
      // Atualizar cache
      if (isSandbox) {
        keyCache.sandbox = sanitizedKey;
      } else {
        keyCache.production = sanitizedKey;
      }
      keyCache.timestamp = now;
      
      // Testar a validade da chave antes de retornar
      const keyIsValid = await testApiKey(sanitizedKey, isSandbox);
      if (!keyIsValid) {
        console.error('[getAsaasApiKey] ERRO: A chave API não passou no teste de validação!');
        console.error('[getAsaasApiKey] Considere gerar uma nova chave de API no painel do Asaas.');
        // Ainda retornamos a chave, mas agora sabemos que ela é inválida
      } else {
        console.log('[getAsaasApiKey] Chave API validada com sucesso!');
      }
      
      console.log('==================== FIM DA OPERAÇÃO getAsaasApiKey (do DB) ====================');
      return sanitizedKey;
    }
    
    if (keyError) {
      console.error('[getAsaasApiKey] Erro ao buscar chaves no sistema novo:', keyError);
    } else {
      console.log('[getAsaasApiKey] Nenhuma chave ativa encontrada no sistema novo');
    }
    
    // 2. Fallback para o sistema legado
    console.log('[getAsaasApiKey] Tentando obter chave do sistema legado...');
    const { data: legacyConfig, error: configError } = await supabase
      .from('asaas_config')
      .select('sandbox_key, production_key, sandbox')
      .single();
      
    if (configError) {
      console.error('[getAsaasApiKey] Erro ao buscar configuração do sistema legado:', configError);
      console.log('==================== FIM DA OPERAÇÃO getAsaasApiKey (com erro) ====================');
      return null;
    }
    
    // Verificar se o modo sandbox da configuração corresponde ao solicitado
    const configSandbox = legacyConfig?.sandbox ?? true;
    
    if (configSandbox !== isSandbox && !useProductionEnv) {
      console.warn(`[getAsaasApiKey] Atenção: Solicitando chave ${isSandbox ? 'sandbox' : 'produção'} mas a configuração está definida como ${configSandbox ? 'sandbox' : 'produção'}`);
      // Se a variável de ambiente está definida, ignoramos a configuração do banco
      if (useProductionEnvRaw === 'true') {
        console.log('[getAsaasApiKey] Usando ambiente de PRODUÇÃO devido a variável USE_ASAAS_PRODUCTION=true');
      }
    }
    
    const legacyKey = isSandbox ? legacyConfig?.sandbox_key : legacyConfig?.production_key;
    
    if (!legacyKey) {
      console.error(`[getAsaasApiKey] Chave ${isSandbox ? 'sandbox' : 'produção'} não encontrada no sistema legado`);
      console.log('==================== FIM DA OPERAÇÃO getAsaasApiKey (não encontrada) ====================');
      return null;
    }
    
    // Sanitizar a chave antes de retornar
    const sanitizedLegacyKey = sanitizeApiKey(legacyKey);
    
    // Verificar formato básico da chave legada
    if (!sanitizedLegacyKey.startsWith('$aact_')) {
      console.error('[getAsaasApiKey] ALERTA CRÍTICO: A chave legada não começa com "$aact_", o que é incomum para chaves Asaas');
    }
    
    console.log(`[getAsaasApiKey] Chave obtida do sistema legado com sucesso (${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'})`);
    console.log(`[getAsaasApiKey] Primeiros caracteres da chave legada: ${sanitizedLegacyKey.substring(0, 8)}...`);
    console.log(`[getAsaasApiKey] Últimos caracteres da chave legada: ...${sanitizedLegacyKey.substring(sanitizedLegacyKey.length - 4)}`);
    console.log(`[getAsaasApiKey] Comprimento da chave legada: ${sanitizedLegacyKey.length} caracteres`);
    console.log(`[getAsaasApiKey] Comprimento original: ${legacyKey.length}, Após sanitização: ${sanitizedLegacyKey.length}`);
    
    // Verificar se a sanitização alterou a chave
    if (legacyKey !== sanitizedLegacyKey) {
      console.warn('[getAsaasApiKey] ALERTA: A chave legada foi sanitizada, removendo caracteres problemáticos');
      if (legacyKey.length !== sanitizedLegacyKey.length) {
        console.warn(`[getAsaasApiKey] Diferença de tamanho: ${legacyKey.length - sanitizedLegacyKey.length} caracteres removidos`);
      }
    }
    
    // Atualizar cache
    if (isSandbox) {
      keyCache.sandbox = sanitizedLegacyKey;
    } else {
      keyCache.production = sanitizedLegacyKey;
    }
    keyCache.timestamp = now;
    
    // Testar a validade da chave antes de retornar
    const keyIsValid = await testApiKey(sanitizedLegacyKey, isSandbox);
    if (!keyIsValid) {
      console.error('[getAsaasApiKey] ERRO: A chave API legada não passou no teste de validação!');
      console.error('[getAsaasApiKey] Considere gerar uma nova chave de API no painel do Asaas.');
      // Ainda retornamos a chave, mas agora sabemos que ela é inválida
    } else {
      console.log('[getAsaasApiKey] Chave API legada validada com sucesso!');
    }
    
    console.log('==================== FIM DA OPERAÇÃO getAsaasApiKey (sistema legado) ====================');
    return sanitizedLegacyKey;
  } catch (error) {
    console.error('[getAsaasApiKey] Erro ao obter chave API do Asaas:', error);
    console.log('==================== FIM DA OPERAÇÃO getAsaasApiKey (com erro) ====================');
    return null;
  }
}

/**
 * Função para limpar o cache de chaves
 */
export function clearKeyCache(): void {
  keyCache = {
    sandbox: null,
    production: null,
    timestamp: 0
  };
  console.log('Cache de chaves API limpo');
}

/**
 * Função para verificar diretamente se uma chave API é válida
 * Realiza uma chamada simples para a API do Asaas
 */
export async function testApiKey(apiKey: string, isSandbox: boolean): Promise<boolean> {
  console.log('==================== INÍCIO DO TESTE DE CHAVE API ====================');
  const apiBaseUrl = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/api/v3';
  const endpoint = `${apiBaseUrl}/customers?limit=1`;
  
  // Verificar se a chave tem o formato esperado
  if (!apiKey.startsWith('$aact_')) {
    console.warn(`[testApiKey] ALERTA: A chave não começa com "$aact_", formato possivelmente inválido`);
  }
  
  try {
    console.log(`[testApiKey] Testando chave API no ambiente ${isSandbox ? 'sandbox' : 'produção'}`);
    console.log(`[testApiKey] URL: ${endpoint}`);
    console.log(`[testApiKey] Primeiros caracteres da chave: ${apiKey.substring(0, 8)}...`);
    console.log(`[testApiKey] Últimos caracteres da chave: ...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`[testApiKey] Comprimento total da chave: ${apiKey.length}`);
    
    // Verificamos se há espaços na chave
    if (apiKey.includes(' ')) {
      console.warn('[testApiKey] ALERTA: A chave ainda contém espaços, o que pode causar falhas de autenticação');
    }
    
    const authHeader = `Bearer ${apiKey}`;
    console.log(`[testApiKey] Authorization header (formato): Bearer ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`[testApiKey] Comprimento total do header: ${authHeader.length}`);
    
    // Usar fetch diretamente para diagnosticar problemas de rede ou CORS
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });
    
    console.log(`[testApiKey] Status da resposta: ${response.status} ${response.statusText}`);
    
    // Mostrar todos os headers da resposta para diagnóstico
    console.log('[testApiKey] Headers da resposta:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
    
    // Mostrar corpo da resposta para diagnóstico
    const responseText = await response.text();
    console.log('[testApiKey] Corpo da resposta:', responseText);
    
    if (response.ok) {
      console.log('[testApiKey] Chave API válida!');
      console.log('==================== FIM DO TESTE DE CHAVE API (válida) ====================');
      return true;
    } else {
      console.error('[testApiKey] Erro na validação da chave API:', response.status, response.statusText);
      console.log('==================== FIM DO TESTE DE CHAVE API (inválida) ====================');
      return false;
    }
  } catch (error) {
    console.error('[testApiKey] Erro ao testar chave API:', error);
    console.log('==================== FIM DO TESTE DE CHAVE API (com erro) ====================');
    return false;
  }
}

/**
 * Função para diagnóstico: executa um teste completo com cURL simulado
 * para validar a chave em ambiente externo
 */
export async function simulateCurlTest(apiKey: string, isSandbox: boolean): Promise<{
  success: boolean;
  status?: number;
  response?: string;
  error?: string;
}> {
  try {
    const apiBaseUrl = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/api/v3';
    const endpoint = `${apiBaseUrl}/status`;
    
    console.log(`[simulateCurlTest] Testando chave como se fosse cURL para: ${endpoint}`);
    console.log(`[simulateCurlTest] Authorization: Bearer ${apiKey.substring(0, 8)}...`);
    
    // Simular um cURL request
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const responseText = await response.text();
    
    return {
      success: response.ok,
      status: response.status,
      response: responseText
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
