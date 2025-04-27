
import { supabase } from '@/integrations/supabase/client';
import { AsaasApiKey } from './types';
import { trackKeyError } from './keyStatisticsService';

// Variável para cache temporal das chaves
let keyCache: {
  sandbox: AsaasApiKey | null;
  production: AsaasApiKey | null;
  timestamp: number;
} = {
  sandbox: null,
  production: null,
  timestamp: 0
};

// Tempo de expiração do cache (5 minutos)
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Obtém a chave API ativa com base no ambiente (sandbox ou produção)
 */
export const getActiveApiKey = async (isSandbox: boolean): Promise<AsaasApiKey | null> => {
  try {
    // Verificar cache
    const now = Date.now();
    if (now - keyCache.timestamp < CACHE_EXPIRY_MS) {
      const cachedKey = isSandbox ? keyCache.sandbox : keyCache.production;
      if (cachedKey) {
        console.log(`Usando chave ${isSandbox ? 'sandbox' : 'produção'} do cache: ${cachedKey.key_name}`);
        return cachedKey;
      }
    }
    
    console.log(`Buscando chave ${isSandbox ? 'sandbox' : 'produção'} ativa no banco de dados`);
    
    // Primeiro, verificamos se há uma chave explicitamente configurada como ativa
    const { data: config, error: configError } = await supabase
      .from('asaas_config')
      .select('active_key_id, sandbox')
      .maybeSingle();
      
    if (configError) {
      console.error('Erro ao buscar configuração Asaas:', configError);
      throw configError;
    }
    
    // Verificar se o modo sandbox definido na configuração corresponde ao solicitado
    const configSandbox = config?.sandbox ?? true;
    const activeKeyId = config?.active_key_id;
    
    console.log(`Configuração do sistema: sandbox=${configSandbox}, chave ativa ID=${activeKeyId || 'não definida'}`);
    
    // Verificar se o modo de ambiente solicitado é compatível com a configuração global
    if (configSandbox !== isSandbox) {
      console.warn(`Atenção: Solicitação de chave ${isSandbox ? 'sandbox' : 'produção'} não corresponde à configuração do sistema (${configSandbox ? 'sandbox' : 'produção'})`);
      // Se a configuração global estiver definida para produção, mas pediram sandbox, respeitamos a solicitação mas logamos
      // O mesmo para o caso contrário
    }
    
    // Se temos um ID de chave ativa, buscamos essa chave específica
    if (activeKeyId) {
      const { data: activeKey, error: activeKeyError } = await supabase
        .from('asaas_api_keys')
        .select('*')
        .eq('id', activeKeyId)
        .eq('is_sandbox', isSandbox)
        .eq('is_active', true)
        .maybeSingle();
        
      if (!activeKeyError && activeKey) {
        console.log(`Usando chave API ativa por ID (ID: ${activeKey.id}, Nome: ${activeKey.key_name})`);
        
        // Atualizar cache
        if (isSandbox) {
          keyCache.sandbox = activeKey;
        } else {
          keyCache.production = activeKey;
        }
        keyCache.timestamp = now;
        
        return activeKey;
      } else {
        console.log(`Chave ativa configurada (ID: ${activeKeyId}) não encontrada ou não é do tipo ${isSandbox ? 'sandbox' : 'produção'}, buscando por prioridade...`);
      }
    }
    
    // Caso contrário, buscamos a chave ativa de maior prioridade para o ambiente
    const { data, error } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('is_active', true)
      .eq('is_sandbox', isSandbox)
      .order('priority')
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error('Erro ao buscar chave por prioridade:', error);
      throw error;
    }
    
    if (data) {
      console.log(`Usando chave API por prioridade (ID: ${data.id}, Nome: ${data.key_name})`);
      
      // Atualizar cache
      if (isSandbox) {
        keyCache.sandbox = data;
      } else {
        keyCache.production = data;
      }
      keyCache.timestamp = now;
    } else {
      console.warn(`Nenhuma chave ${isSandbox ? 'sandbox' : 'produção'} ativa encontrada`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching active API key:', error);
    return null;
  }
};

export const getNextApiKey = async (currentKeyId: number, isSandbox: boolean): Promise<AsaasApiKey | null> => {
  try {
    console.log(`Buscando próxima chave após falha da chave ID: ${currentKeyId}`);
    
    const { data, error } = await supabase
      .rpc('get_next_active_key', { 
        current_key_id: currentKeyId, 
        is_sandbox_mode: isSandbox 
      });
      
    if (error) {
      console.error('Erro ao buscar próxima chave:', error);
      throw error;
    }
    
    if (!data) {
      console.log('Nenhuma chave alternativa disponível');
      return null;
    }
    
    // Fetch the complete key data
    const { data: keyData, error: keyError } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('id', data)
      .single();
      
    if (keyError) {
      console.error('Erro ao buscar dados da próxima chave:', keyError);
      throw keyError;
    }
    
    console.log(`Alternando para próxima chave (ID: ${keyData.id}, Nome: ${keyData.key_name})`);
    
    // Atualizar o cache
    const now = Date.now();
    if (isSandbox) {
      keyCache.sandbox = keyData;
    } else {
      keyCache.production = keyData;
    }
    keyCache.timestamp = now;
    
    return keyData;
  } catch (err) {
    const error = err as Error;
    console.error('Error getting next API key:', error);
    trackKeyError(currentKeyId, error.message || 'Erro desconhecido', {});
    return null;
  }
};

export const updateActiveKey = async (keyId: number): Promise<void> => {
  try {
    // Primeiro, obter informações sobre a chave para saber se é sandbox ou produção
    const { data: keyData, error: keyError } = await supabase
      .from('asaas_api_keys')
      .select('is_sandbox')
      .eq('id', keyId)
      .single();
      
    if (keyError) {
      console.error('Erro ao verificar tipo da chave:', keyError);
      throw keyError;
    }
    
    // Agora atualizamos a configuração global
    const { error } = await supabase
      .from('asaas_config')
      .update({ 
        active_key_id: keyId,
        // Atualiza também o modo sandbox para corresponder à chave selecionada
        sandbox: keyData.is_sandbox
      })
      .eq('id', 1);
      
    if (error) {
      console.error('Erro ao atualizar chave ativa:', error);
      throw error;
    }
    
    console.log(`Chave ativa atualizada para ID: ${keyId} (Modo: ${keyData.is_sandbox ? 'sandbox' : 'produção'})`);
    
    // Limpar cache para forçar recarregamento
    keyCache = {
      sandbox: null,
      production: null,
      timestamp: 0
    };
  } catch (error) {
    console.error('Error updating active key:', error);
    throw error;
  }
};

export const addApiKey = async (
  keyName: string, 
  apiKey: string, 
  isSandbox: boolean,
  priority: number
): Promise<AsaasApiKey | null> => {
  try {
    const { data, error } = await supabase
      .from('asaas_api_keys')
      .insert([{ 
        key_name: keyName,
        api_key: apiKey,
        is_sandbox: isSandbox,
        priority: priority,
        is_active: true
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    // Limpar cache para forçar recarregamento
    keyCache = {
      sandbox: null,
      production: null,
      timestamp: 0
    };
    
    return data;
  } catch (error) {
    console.error('Error adding API key:', error);
    return null;
  }
};

export const listApiKeys = async (isSandbox: boolean | null = null): Promise<AsaasApiKey[]> => {
  try {
    let query = supabase
      .from('asaas_api_keys')
      .select('*');
      
    if (isSandbox !== null) {
      query = query.eq('is_sandbox', isSandbox);
    }
    
    query = query.order('priority');
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error in listApiKeys:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error listing API keys:', error);
    return [];
  }
};

export const toggleKeyStatus = async (keyId: number, isActive: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('asaas_api_keys')
      .update({ is_active: isActive })
      .eq('id', keyId);
      
    if (error) throw error;
    
    // Limpar cache para forçar recarregamento
    keyCache = {
      sandbox: null,
      production: null,
      timestamp: 0
    };
  } catch (error) {
    console.error('Error toggling key status:', error);
    throw error;
  }
};

// Função para limpar o cache manualmente
export const clearKeyCache = (): void => {
  keyCache = {
    sandbox: null,
    production: null,
    timestamp: 0
  };
  console.log('Cache de chaves API limpo manualmente');
};
