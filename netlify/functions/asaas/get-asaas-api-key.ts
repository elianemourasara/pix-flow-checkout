
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
  // Determinar se devemos usar sandbox baseado na variável de ambiente
  // Esta configuração tem precedência sobre o parâmetro
  const useProductionEnv = process.env.USE_ASAAS_PRODUCTION === 'true';
  
  // Se a variável de ambiente está definida, usamos ela para determinar o ambiente
  // Caso contrário, usamos o parâmetro fornecido ou padrão para sandbox
  const isSandbox = useProductionEnv ? false : (isSandboxParam !== undefined ? isSandboxParam : true);
  
  console.log(`[getAsaasApiKey] Ambiente determinado pelo USE_ASAAS_PRODUCTION=${process.env.USE_ASAAS_PRODUCTION}`);
  console.log(`[getAsaasApiKey] Valor de useProductionEnv: ${useProductionEnv}`);
  console.log(`[getAsaasApiKey] Obtendo chave Asaas para ambiente ${isSandbox ? 'sandbox' : 'produção'}`);
  
  try {
    // Verificar cache
    const now = Date.now();
    if (now - keyCache.timestamp < KEY_CACHE_EXPIRY) {
      const cachedKey = isSandbox ? keyCache.sandbox : keyCache.production;
      if (cachedKey) {
        console.log(`[getAsaasApiKey] Usando chave ${isSandbox ? 'sandbox' : 'produção'} do cache`);
        // Exibir primeiros caracteres da chave para validação nos logs
        console.log(`[getAsaasApiKey] Chave em cache (primeiros caracteres): ${cachedKey.substring(0, 8)}...`);
        console.log(`[getAsaasApiKey] Comprimento da chave em cache: ${cachedKey.length} caracteres`);
        return sanitizeApiKey(cachedKey);
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
      console.log(`[getAsaasApiKey] Tipo da chave: ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);
      console.log(`[getAsaasApiKey] Primeiros caracteres da chave: ${activeKeys[0].api_key.substring(0, 8)}...`);
      console.log(`[getAsaasApiKey] Comprimento da chave: ${activeKeys[0].api_key.length} caracteres`);
      
      // Sanitizar a chave antes de retornar
      const sanitizedKey = sanitizeApiKey(activeKeys[0].api_key);
      console.log(`[getAsaasApiKey] Sanitização alterou tamanho? Antes: ${activeKeys[0].api_key.length}, Depois: ${sanitizedKey.length}`);
      
      if (sanitizedKey.length < 30) {
        console.error('[getAsaasApiKey] ALERTA: A chave parece muito curta e pode estar incompleta');
      }
      
      // Verificar outros potenciais problemas com a chave
      if (sanitizedKey.includes(' ')) {
        console.error('[getAsaasApiKey] ALERTA: A chave ainda contém espaços mesmo após sanitização');
      }
      
      // Atualizar cache
      if (isSandbox) {
        keyCache.sandbox = sanitizedKey;
      } else {
        keyCache.production = sanitizedKey;
      }
      keyCache.timestamp = now;
      
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
    
    // Sanitizar a chave antes de retornar
    const sanitizedLegacyKey = sanitizeApiKey(legacyKey);
    
    console.log(`[getAsaasApiKey] Chave obtida do sistema legado com sucesso (${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'})`);
    console.log(`[getAsaasApiKey] Primeiros caracteres da chave legada: ${sanitizedLegacyKey.substring(0, 8)}...`);
    console.log(`[getAsaasApiKey] Comprimento da chave legada: ${sanitizedLegacyKey.length} caracteres`);
    
    // Atualizar cache
    if (isSandbox) {
      keyCache.sandbox = sanitizedLegacyKey;
    } else {
      keyCache.production = sanitizedLegacyKey;
    }
    keyCache.timestamp = now;
    
    return sanitizedLegacyKey;
  } catch (error) {
    console.error('[getAsaasApiKey] Erro ao obter chave API do Asaas:', error);
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
