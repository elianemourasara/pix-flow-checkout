
import { useState, useEffect } from 'react';
import { getActiveApiKey, getAllApiKeys } from '@/services/asaas/keyService';
import { AsaasApiKey } from '@/services/asaas/types';

interface AsaasApiKeysOptions {
  isSandbox?: boolean;
}

export function useAsaasApiKeys({ isSandbox = false }: AsaasApiKeysOptions = {}) {
  const [activeKey, setActiveKey] = useState<{id: number; key: string; name: string} | null>(null);
  const [fallbackKeys, setFallbackKeys] = useState<{id: number; key: string; name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadKeys() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Carregar a chave ativa
        const activeKeyData = await getActiveApiKey(isSandbox);
        
        if (activeKeyData) {
          setActiveKey({
            id: activeKeyData.id,
            key: activeKeyData.api_key,
            name: activeKeyData.key_name
          });
        } else {
          setActiveKey(null);
        }
        
        // Carregar todas as chaves ativas para fallback
        const allKeys = await getAllApiKeys(isSandbox);
        const activeKeys = allKeys.filter(k => k.is_active);
        
        // Excluir a chave ativa principal da lista de fallback
        const fallbackKeysData = activeKeyData 
          ? activeKeys.filter((k: AsaasApiKey) => k.id !== activeKeyData.id)
          : activeKeys;
        
        setFallbackKeys(
          fallbackKeysData.map((k: AsaasApiKey) => ({
            id: k.id,
            key: k.api_key,
            name: k.key_name
          }))
        );
      } catch (err) {
        console.error('Erro ao carregar chaves Asaas:', err);
        setError('Falha ao carregar chaves da API Asaas');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadKeys();
  }, [isSandbox]);
  
  return {
    activeKey,
    fallbackKeys,
    isLoading,
    error
  };
}
