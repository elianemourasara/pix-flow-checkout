
import { supabase } from '@/integrations/supabase/client';
import { AsaasApiKey } from '../types';

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
