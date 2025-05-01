
import { useState, useEffect, useCallback } from 'react';
import { AsaasApiKey, AsaasEnvironment } from '@/services/asaas/types';
import { 
  getActiveApiKey, 
  getAllApiKeys, 
  setActiveKey as setActiveKeyApi 
} from '@/services/asaas/keyService';

/**
 * Hook para gerenciar chaves de API do Asaas
 */
export const useAsaasKeyManager = () => {
  const [environment, setEnvironment] = useState<AsaasEnvironment>(AsaasEnvironment.SANDBOX);
  const [keys, setKeys] = useState<AsaasApiKey[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar chaves do ambiente atual
  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isSandbox = environment === AsaasEnvironment.SANDBOX;
      const allKeys = await getAllApiKeys(isSandbox);
      setKeys(allKeys || []);
      
      // Buscar chave ativa
      const activeKey = await getActiveApiKey(isSandbox);
      setActiveKeyId(activeKey?.id || null);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar chaves API');
      console.error('Erro ao buscar chaves API:', err);
    } finally {
      setIsLoading(false);
    }
  }, [environment]);

  // Carregar chaves quando o componente for montado ou o ambiente mudar
  useEffect(() => {
    fetchKeys();
  }, [fetchKeys, environment]);

  // Função para mudar o ambiente
  const changeEnvironment = useCallback((newEnvironment: AsaasEnvironment) => {
    setEnvironment(newEnvironment);
  }, []);

  // Função para definir uma chave como ativa
  const setActiveKey = useCallback(async (keyId: number) => {
    setIsLoading(true);
    try {
      const success = await setActiveKeyApi(keyId);
      if (success) {
        setActiveKeyId(keyId);
        // Recarregar chaves para refletir a mudança
        fetchKeys();
      } else {
        throw new Error('Falha ao definir chave como ativa');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao definir chave como ativa');
      console.error('Erro ao definir chave como ativa:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchKeys]);

  return {
    environment,
    keys,
    activeKeyId,
    isLoading,
    error,
    changeEnvironment,
    setActiveKey,
    refreshKeys: fetchKeys
  };
};
