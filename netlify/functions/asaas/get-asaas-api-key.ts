
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
 * Função robusta para obter chave da API Asaas
 * Implementa cache em memória e mecanismo de fallback
 * 
 * IMPORTANTE: Esta função respeita a variável de ambiente USE_ASAAS_PRODUCTION
 * Se USE_ASAAS_PRODUCTION=true, sempre retornará uma chave de produção
 * Se USE_ASAAS_PRODUCTION=false ou não definida, sempre retornará uma chave sandbox
 */
export async function getAsaasApiKey(isSandboxParam?: boolean): Promise<string | null> {
  // Determinar se devemos usar sandbox baseado na variável de ambiente
  // Esta configuração tem precedência sobre o parâmetro
  const useProductionEnv = process.env.USE_ASAAS_PRODUCTION === 'true';
  
  // Se a variável de ambiente está definida, usamos ela para determinar o ambiente
  // Caso contrário, usamos o parâmetro fornecido ou padrão para sandbox
  const isSandbox = useProductionEnv ? false : (isSandboxParam !== undefined ? isSandboxParam : true);
  
  console.log(`[getAsaasApiKey] Ambiente forçado por USE_ASAAS_PRODUCTION=${useProductionEnv ? 'true' : 'false'}`);
  console.log(`[getAsaasApiKey] Obtendo chave Asaas para ambiente ${isSandbox ? 'sandbox' : 'produção'}`);
  
  try {
    // Verificar cache
    const now = Date.now();
    if (now - keyCache.timestamp < KEY_CACHE_EXPIRY) {
      const cachedKey = isSandbox ? keyCache.sandbox : keyCache.production;
      if (cachedKey) {
        console.log(`[getAsaasApiKey] Usando chave ${isSandbox ? 'sandbox' : 'produção'} do cache`);
        return cachedKey;
      }
    }
    
    // 1. Primeiro tenta obter do sistema novo (asaas_api_keys)
    console.log('[getAsaasApiKey] Tentando obter chave do sistema novo...');
    const { data: activeKeys, error: keyError } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('is_active', true)
      .eq('is_sandbox', isSandbox)
      .order('priority', { ascending: true })
      .limit(1);
      
    if (!keyError && activeKeys && activeKeys.length > 0) {
      console.log(`[getAsaasApiKey] Chave obtida do sistema novo: ${activeKeys[0].key_name} (ID: ${activeKeys[0].id})`);
      console.log(`[getAsaasApiKey] Tipo da chave: ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);
      
      // Atualizar cache
      if (isSandbox) {
        keyCache.sandbox = activeKeys[0].api_key;
      } else {
        keyCache.production = activeKeys[0].api_key;
      }
      keyCache.timestamp = now;
      
      return activeKeys[0].api_key;
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
      return null;
    }
    
    // Verificar se o modo sandbox da configuração corresponde ao solicitado
    const configSandbox = legacyConfig?.sandbox ?? true;
    
    if (configSandbox !== isSandbox && !useProductionEnv) {
      console.warn(`[getAsaasApiKey] Atenção: Solicitando chave ${isSandbox ? 'sandbox' : 'produção'} mas a configuração está definida como ${configSandbox ? 'sandbox' : 'produção'}`);
      // Se a variável de ambiente está definida, ignoramos a configuração do banco
      if (process.env.USE_ASAAS_PRODUCTION === 'true') {
        console.log('[getAsaasApiKey] Usando ambiente de PRODUÇÃO devido a variável USE_ASAAS_PRODUCTION=true');
      }
    }
    
    const legacyKey = isSandbox ? legacyConfig?.sandbox_key : legacyConfig?.production_key;
    
    if (!legacyKey) {
      console.error(`[getAsaasApiKey] Chave ${isSandbox ? 'sandbox' : 'produção'} não encontrada no sistema legado`);
      return null;
    }
    
    console.log(`[getAsaasApiKey] Chave obtida do sistema legado com sucesso (${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'})`);
    
    // Atualizar cache
    if (isSandbox) {
      keyCache.sandbox = legacyKey;
    } else {
      keyCache.production = legacyKey;
    }
    keyCache.timestamp = now;
    
    return legacyKey;
  } catch (error) {
    console.error('[getAsaasApiKey] Erro ao obter chave API do Asaas:', error);
    return null;
  }
}

/**
 * Função para obter a URL base da API Asaas
 * Respeita a variável de ambiente USE_ASAAS_PRODUCTION
 */
export function getAsaasApiBaseUrl(isSandboxParam?: boolean): string {
  // A variável de ambiente tem precedência sobre o parâmetro
  const useProductionEnv = process.env.USE_ASAAS_PRODUCTION === 'true';
  const isSandbox = useProductionEnv ? false : (isSandboxParam !== undefined ? isSandboxParam : true);
  
  console.log(`[getAsaasApiBaseUrl] Usando URL ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'} (USE_ASAAS_PRODUCTION=${useProductionEnv ? 'true' : 'false'})`);
  
  return isSandbox 
    ? 'https://sandbox.asaas.com/api/v3' 
    : 'https://api.asaas.com/api/v3';
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
