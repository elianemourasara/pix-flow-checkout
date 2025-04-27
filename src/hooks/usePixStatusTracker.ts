
import { useState, useEffect, useRef } from 'react';
import { PaymentStatus } from '@/types/checkout';
import { checkPaymentStatus } from '@/services/asaasService';

interface UsePixStatusTrackerProps {
  paymentId: string | null;
  initialStatus?: PaymentStatus | null;
  pollingInterval?: number;
  maxPolls?: number;
}

export const usePixStatusTracker = ({
  paymentId,
  initialStatus = null,
  pollingInterval = 8000, // 8 segundos entre verificações
  maxPolls = 15 // Máximo de 15 verificações (2 minutos total)
}: UsePixStatusTrackerProps) => {
  const [status, setStatus] = useState<PaymentStatus | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const timerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  
  // Função para verificar o status
  const checkStatus = async () => {
    if (!paymentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[usePixStatusTracker] Verificando status para: ${paymentId}`);
      const result = await checkPaymentStatus(paymentId);
      
      // Se o componente foi desmontado, não atualizar o estado
      if (!isMountedRef.current) return;
      
      // Se o resultado for objeto com status e erro
      if (typeof result === 'object' && 'status' in result) {
        if (result.error) {
          console.warn(`[usePixStatusTracker] Erro não crítico: ${result.error}`);
        }
        
        console.log(`[usePixStatusTracker] Status recebido: ${result.status} (fonte: ${result.source || 'desconhecida'})`);
        setStatus(result.status);
      } else {
        // Se o resultado for direto o status
        console.log(`[usePixStatusTracker] Status recebido: ${result}`);
        setStatus(result);
      }
      
    } catch (e) {
      if (!isMountedRef.current) return;
      
      const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
      console.error(`[usePixStatusTracker] Erro ao verificar status: ${errorMessage}`);
      setError(errorMessage);
      
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setPollCount(prev => prev + 1);
      }
    }
  };
  
  // Iniciar verificações quando o paymentId estiver disponível
  useEffect(() => {
    if (!paymentId) return;
    
    // Verificação inicial imediata
    checkStatus();
    
    // Configurar o polling
    const setupPolling = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      
      timerRef.current = window.setTimeout(() => {
        if (pollCount >= maxPolls) {
          console.log(`[usePixStatusTracker] Atingido limite máximo de ${maxPolls} verificações`);
          return;
        }
        
        checkStatus();
        setupPolling();
      }, pollingInterval);
    };
    
    setupPolling();
    
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [paymentId, pollCount]);
  
  // Reiniciar contagem quando o paymentId mudar
  useEffect(() => {
    setPollCount(0);
    setError(null);
    
    if (paymentId) {
      console.log(`[usePixStatusTracker] Iniciando rastreamento para novo pagamento: ${paymentId}`);
    }
    
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [paymentId]);
  
  // Função para forçar uma verificação manual
  const refreshStatus = () => {
    if (isLoading) return;
    checkStatus();
  };
  
  return {
    status,
    isLoading,
    error,
    pollCount,
    refreshStatus,
    isMaxPolls: pollCount >= maxPolls
  };
};
