
import { supabase } from '@/integrations/supabase/client';
import { AsaasApiKey } from '../types';

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
