
import { supabase } from '@/integrations/supabase/client';
import { AsaasEnvironment, ApiTestResult } from './types';

/**
 * Estrutura de uma chave API do Asaas
 */
export interface AsaasApiKey {
  id: number;
  key_name: string;
  api_key: string;
  is_active: boolean;
  is_sandbox: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

/**
 * Obtém a chave API ativa para um ambiente específico
 * @param isSandbox Se deve buscar chave para ambiente sandbox
 * @returns A chave API ativa ou null se não encontrada
 */
export async function getActiveApiKey(isSandbox: boolean): Promise<AsaasApiKey | null> {
  try {
    // Buscar chaves ativas para o ambiente especificado, ordenadas por prioridade
    const { data: keys, error } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('is_sandbox', isSandbox)
      .eq('is_active', true)
      .order('priority', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar chaves API ativas:', error);
      return null;
    }
    
    // Retornar a chave de maior prioridade (menor número)
    if (keys && keys.length > 0) {
      return keys[0] as AsaasApiKey;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar chave API:', error);
    return null;
  }
}

/**
 * Obtém todas as chaves API para um ambiente específico
 * @param isSandbox Se deve buscar chaves para ambiente sandbox
 * @returns Lista de chaves API ou array vazio
 */
export async function getAllApiKeys(isSandbox: boolean): Promise<AsaasApiKey[]> {
  try {
    const { data: keys, error } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('is_sandbox', isSandbox)
      .order('priority', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar chaves API:', error);
      return [];
    }
    
    return keys as AsaasApiKey[];
  } catch (error) {
    console.error('Erro ao buscar chaves API:', error);
    return [];
  }
}

/**
 * Alias para getAllApiKeys, para manter compatibilidade
 */
export const listApiKeys = getAllApiKeys;

/**
 * Ativa uma chave API específica
 * @param keyId ID da chave a ser ativada
 * @returns true se a operação foi bem-sucedida
 */
export async function setActiveKey(keyId: number): Promise<boolean> {
  try {
    // Obter a chave para saber se é sandbox ou produção
    const { data: key, error: keyError } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('id', keyId)
      .single();
      
    if (keyError || !key) {
      console.error('Erro ao buscar chave:', keyError);
      return false;
    }
    
    // Atualizar a chave atual para ativa e todas as outras do mesmo ambiente para inativas
    const { error } = await supabase
      .from('asaas_api_keys')
      .update({ is_active: false })
      .eq('is_sandbox', key.is_sandbox);
      
    if (error) {
      console.error('Erro ao desativar chaves existentes:', error);
      return false;
    }
    
    // Ativar a chave selecionada
    const { error: updateError } = await supabase
      .from('asaas_api_keys')
      .update({ is_active: true })
      .eq('id', keyId);
      
    if (updateError) {
      console.error('Erro ao ativar chave:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao ativar chave API:', error);
    return false;
  }
}

/**
 * Alias para setActiveKey, para manter compatibilidade
 */
export const updateActiveKey = setActiveKey;

/**
 * Alterna o status de ativação de uma chave
 * @param keyId ID da chave
 * @param isActive Novo status de ativação
 * @returns true se sucesso
 */
export async function toggleKeyStatus(keyId: number, isActive: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('asaas_api_keys')
      .update({ is_active: isActive })
      .eq('id', keyId);
      
    if (error) {
      console.error('Erro ao alternar status da chave:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao alternar status da chave:', error);
    return false;
  }
}

/**
 * Adiciona uma nova chave API
 * @param name Nome descritivo da chave
 * @param apiKey Chave API
 * @param isSandbox Se é uma chave sandbox
 * @param priority Prioridade da chave (menor = maior prioridade)
 * @returns A chave criada ou null se falhou
 */
export async function addApiKey(
  name: string, 
  apiKey: string, 
  isSandbox: boolean, 
  priority: number = 1
): Promise<AsaasApiKey | null> {
  // Sanitizar a chave para remover espaços, quebras de linha, etc.
  const sanitizedKey = apiKey.trim();
  
  try {
    const { data, error } = await supabase
      .from('asaas_api_keys')
      .insert({
        key_name: name,
        api_key: sanitizedKey,
        is_sandbox: isSandbox,
        priority: priority,
        is_active: true
      })
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao adicionar chave API:', error);
      return null;
    }
    
    return data as AsaasApiKey;
  } catch (error) {
    console.error('Erro ao adicionar chave API:', error);
    return null;
  }
}

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
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sanitizedKey}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        status: response.status,
        data
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        status: response.status,
        message: `Erro na API: ${response.statusText}`,
        error: errorText
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Erro ao testar chave API',
      error: error.message
    };
  }
}
