
import { supabase } from './supabase-client';

/**
 * Função robusta para obter chave da API Asaas
 * Implementa cache em memória e mecanismo de fallback
 */
export async function getAsaasApiKey(isSandbox: boolean): Promise<string | null> {
  console.log(`Obtendo chave Asaas para ambiente ${isSandbox ? 'sandbox' : 'produção'}`);
  
  try {
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
      .select('sandbox_key, production_key')
      .single();
      
    if (configError) {
      console.error('Erro ao buscar configuração do sistema legado:', configError);
      return null;
    }
    
    const legacyKey = isSandbox ? legacyConfig?.sandbox_key : legacyConfig?.production_key;
    
    if (!legacyKey) {
      console.error(`Chave ${isSandbox ? 'sandbox' : 'produção'} não encontrada no sistema legado`);
      return null;
    }
    
    console.log('Chave obtida do sistema legado com sucesso');
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
