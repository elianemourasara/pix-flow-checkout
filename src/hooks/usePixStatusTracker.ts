
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
  pollingInterval = 8000,
  maxPolls = 15
}: UsePixStatusTrackerProps) => {
  const [status, setStatus] = useState<PaymentStatus | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const timerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Check status function
  const checkStatus = async () => {
    if (!paymentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[usePixStatusTracker] Checking status for: ${paymentId}`);
      const result = await checkPaymentStatus(paymentId);
      
      if (!isMountedRef.current) return;
      
      // Handle response
      if (typeof result === 'object' && 'status' in result) {
        setStatus(result.status);
        if (result.error) {
          console.warn(`[usePixStatusTracker] Non-critical error: ${result.error}`);
        }
      } else {
        setStatus(result);
      }
      
    } catch (e) {
      if (!isMountedRef.current) return;
      
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error(`[usePixStatusTracker] Error checking status: ${errorMessage}`);
      setError(errorMessage);
      
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setPollCount(prev => prev + 1);
      }
    }
  };

  // Start polling when paymentId is available
  useEffect(() => {
    if (!paymentId) return;
    
    checkStatus();
    
    const setupPolling = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      
      timerRef.current = window.setTimeout(() => {
        if (pollCount >= maxPolls) {
          console.log(`[usePixStatusTracker] Reached maximum ${maxPolls} checks`);
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

  // Reset count when paymentId changes
  useEffect(() => {
    setPollCount(0);
    setError(null);
    
    if (paymentId) {
      console.log(`[usePixStatusTracker] Starting tracking for new payment: ${paymentId}`);
    }
    
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [paymentId]);

  return {
    status,
    isLoading,
    error,
    pollCount,
    refreshStatus: checkStatus,
    isMaxPolls: pollCount >= maxPolls
  };
};
