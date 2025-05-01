
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  AsaasApiKey, 
  getActiveApiKey, 
  setActiveKey as updateActiveKey, 
  getAllApiKeys as listApiKeys, 
  toggleKeyStatus 
} from '@/services/asaas/keyService';
import { AsaasEnvironment } from '@/config/asaas';

interface UseAsaasKeyManagerProps {
  initialEnvironment?: AsaasEnvironment;
}

export function useAsaasKeyManager({
  initialEnvironment = AsaasEnvironment.PRODUCTION
}: UseAsaasKeyManagerProps = {}) {
  const [environment, setEnvironment] = useState<AsaasEnvironment>(initialEnvironment);
  const [keys, setKeys] = useState<AsaasApiKey[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isSandbox = environment === AsaasEnvironment.SANDBOX;
  
  // Carregar chaves ao montar o componente ou quando o ambiente muda
  useEffect(() => {
    loadKeys();
  }, [environment]);

  const loadKeys = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Primeiro, carregamos a chave ativa para o ambiente atual
      const activeKey = await getActiveApiKey(isSandbox);
      
      if (activeKey) {
        setActiveKeyId(activeKey.id);
      } else {
        setActiveKeyId(null);
      }
      
      // Depois carregamos todas as chaves para o ambiente atual
      const allKeys = await listApiKeys(isSandbox);
      
      setKeys(allKeys);
    } catch (err) {
      console.error('Erro ao carregar chaves:', err);
      setError('Não foi possível carregar as chaves de API.');
      toast({
        title: 'Erro ao carregar chaves',
        description: 'Não foi possível carregar as chaves de API.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetActiveKey = async (keyId: number) => {
    try {
      await updateActiveKey(keyId);
      setActiveKeyId(keyId);
      toast({
        title: 'Chave ativa atualizada',
        description: 'A chave de API ativa foi alterada com sucesso.',
      });
    } catch (err) {
      console.error('Erro ao atualizar chave ativa:', err);
      toast({
        title: 'Erro ao atualizar chave',
        description: 'Não foi possível atualizar a chave ativa.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleKeyStatus = async (keyId: number, currentStatus: boolean) => {
    try {
      await toggleKeyStatus(keyId, !currentStatus);
      await loadKeys(); // Recarregar chaves após a alteração
      
      toast({
        title: 'Status atualizado',
        description: `A chave foi ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
      });
    } catch (err) {
      console.error('Erro ao alterar status da chave:', err);
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status da chave.',
        variant: 'destructive',
      });
    }
  };

  const changeEnvironment = (newEnvironment: AsaasEnvironment) => {
    setEnvironment(newEnvironment);
  };

  return {
    environment,
    keys,
    activeKeyId,
    isLoading,
    error,
    changeEnvironment,
    setActiveKey: handleSetActiveKey,
    toggleKeyStatus: handleToggleKeyStatus,
    refreshKeys: loadKeys,
    isSandbox
  };
}
