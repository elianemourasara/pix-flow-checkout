
import { supabase } from '@/integrations/supabase/client';

/**
 * Estatísticas de uso de chave API
 */
interface KeyStatistics {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalWebhookEvents: number;
  lastPaymentDate: string | null;
  lastWebhookDate: string | null;
}

/**
 * Obtém estatísticas de uso para uma chave API específica
 * @param keyId ID da chave API
 * @returns Estatísticas de uso
 */
export async function getKeyStatistics(keyId: number): Promise<KeyStatistics | null> {
  try {
    // Obter a chave para buscar o payment_id associado
    const { data: key, error: keyError } = await supabase
      .from('asaas_api_keys')
      .select('*')
      .eq('id', keyId)
      .single();
      
    if (keyError || !key) {
      console.error('Erro ao buscar chave:', keyError);
      return null;
    }
    
    // Estatísticas iniciais zeradas
    const stats: KeyStatistics = {
      totalPayments: 0,
      successfulPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      totalWebhookEvents: 0,
      lastPaymentDate: null,
      lastWebhookDate: null
    };
    
    // TO-DO: Implementar as consultas para obter estatísticas reais
    // Esta implementação requer rastreamento do uso das chaves em pagamentos
    // e eventos de webhook, o que pode ser implementado em uma atualização futura
    
    return stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas da chave:', error);
    return null;
  }
}
