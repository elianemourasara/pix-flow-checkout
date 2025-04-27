
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
 */
export async function getAsaasApiKey(isSandbox: boolean): Promise<string | null> {
  console.log(`Obtendo chave Asaas para ambiente ${isSandbox ? 'sandbox' : 'produção'}`);
  
  try {
    // Verificar cache
    const now = Date.now();
    if (now - keyCache.timestamp < KEY_CACHE_EXPIRY) {
      const cachedKey = isSandbox ? keyCache.sandbox : keyCache.production;
      if (cachedKey) {
        console.log(`Usando chave ${isSandbox ? 'sandbox' : 'produção'} do cache`);
        return cachedKey;
      }
    }
    
    // 1. Primeiro tenta obter do sistema novo (asaas_api_keys)
    console.log('Tentando obter chave do sistema novo...');
    const { data: activeKeys, error: keyError } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('is_active', true)
      .eq('is_sandbox', isSandbox)
      .order('priority', { ascending: true })
      .limit(1);
      
    if (!keyError && activeKeys && activeKeys.length > 0) {
      console.log(`Chave obtida do sistema novo: ${activeKeys[0].key_name}`);
      
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
      console.error('Erro ao buscar chaves no sistema novo:', keyError);
    } else {
      console.log('Nenhuma chave ativa encontrada no sistema novo');
    }
    
    // 2. Fallback para o sistema legado
    console.log('Tentando obter chave do sistema legado...');
    const { data: legacyConfig, error: configError } = await supabase
      .from('asaas_config')
      .select('sandbox_key, production_key, sandbox')
      .single();
      
    if (configError) {
      console.error('Erro ao buscar configuração do sistema legado:', configError);
      return null;
    }
    
    // Verificar se o modo sandbox da configuração corresponde ao solicitado
    const configSandbox = legacyConfig?.sandbox ?? true;
    
    if (configSandbox !== isSandbox) {
      console.warn(`Atenção: Solicitando chave ${isSandbox ? 'sandbox' : 'produção'} mas a configuração está definida como ${configSandbox ? 'sandbox' : 'produção'}`);
      // Continuamos com a solicitação, mas logamos o aviso
    }
    
    const legacyKey = isSandbox ? legacyConfig?.sandbox_key : legacyConfig?.production_key;
    
    if (!legacyKey) {
      console.error(`Chave ${isSandbox ? 'sandbox' : 'produção'} não encontrada no sistema legado`);
      return null;
    }
    
    console.log('Chave obtida do sistema legado com sucesso');
    
    // Atualizar cache
    if (isSandbox) {
      keyCache.sandbox = legacyKey;
    } else {
      keyCache.production = legacyKey;
    }
    keyCache.timestamp = now;
    
    return legacyKey;
  } catch (error) {
    console.error('Erro ao obter chave API do Asaas:', error);
    return null;
  }
}

/**
 * Função para obter a URL base da API Asaas
 */
export function getAsaasApiBaseUrl(isSandbox: boolean): string {
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
