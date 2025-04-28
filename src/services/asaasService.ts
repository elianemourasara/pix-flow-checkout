import { PaymentStatus } from '@/types/checkout';

interface PaymentStatusResponse {
  status: PaymentStatus;
  error?: string;
  source?: string;
}

// Controle de requisições para evitar chamadas duplicadas
const pendingRequests: Record<string, Promise<PaymentStatus | PaymentStatusResponse>> = {};

/**
 * Verifica o status de um pagamento Asaas
 * @param paymentId ID do pagamento no Asaas
 * @returns Status atual do pagamento
 */
export const checkPaymentStatus = async (paymentId: string): Promise<PaymentStatus | PaymentStatusResponse> => {
  try {
    console.log(`Verificando status do pagamento: ${paymentId}`);
    
    // Verificar se já existe uma requisição pendente para este pagamento
    if (pendingRequests[paymentId]) {
      console.log(`Requisição já em andamento para ${paymentId}, reaproveitando...`);
      return await pendingRequests[paymentId];
    }
    
    // Adicionar parâmetro para evitar cache do navegador
    const url = `/api/check-payment-status?paymentId=${paymentId}&t=${Date.now()}`;
    
    // Criar a promessa da requisição
    const requestPromise = (async () => {
      // Implementar mecanismo de retry para lidar com falhas temporárias
      const MAX_RETRIES = 2;
      let retries = 0;
      let lastError = null;
      
      while (retries <= MAX_RETRIES) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Error checking status: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Se não tiver status ou o status não for válido, assumir PENDING
          if (!data.status || typeof data.status !== 'string') {
            console.warn('Invalid status received from API:', data);
            return 'PENDING' as PaymentStatus;
          }
          
          // Normalize status
          let normalizedStatus: PaymentStatus = data.status as PaymentStatus;
          if (normalizedStatus === 'RECEIVED') {
            console.log('Remapeando status RECEIVED para CONFIRMED');
            normalizedStatus = 'CONFIRMED';
          }
          
          return normalizedStatus;
          
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`Attempt ${retries + 1} failed: ${lastError}`);
          retries++;
          
          if (retries <= MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries)));
          }
        }
      }
      
      // After all retries failed
      console.error(`Todas as ${MAX_RETRIES + 1} tentativas falharam. Último erro: ${lastError}`);
      return {
        status: 'PENDING' as PaymentStatus,
        error: `Failed to check status after ${MAX_RETRIES + 1} attempts: ${lastError}`,
        source: 'client_fallback'
      };
    })();
    
    // Store promise to prevent duplicates
    pendingRequests[paymentId] = requestPromise;
    
    // Get result
    const result = await requestPromise;
    
    // Remove from pending after delay
    setTimeout(() => {
      delete pendingRequests[paymentId];
    }, 2000);
    
    return result;
    
  } catch (error) {
    console.error('Error checking payment status:', error);
    return {
      status: 'PENDING' as PaymentStatus,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'exception_handler'
    };
  }
};

/**
 * Gera um pagamento PIX no Asaas
 * @param billingData Dados do cliente e do pagamento
 * @returns Dados do pagamento PIX gerado
 */
export const generatePixPayment = async (billingData: any) => {
  try {
    console.log('Generating PIX payment with data:', billingData);
    
    // Ensure we have all required fields formatted correctly
    interface FormattedData {
      name: string;
      cpfCnpj: string;
      email: string;
      phone: string;
      orderId: string;
      value: number;
      description: string;
      [key: string]: string | number; // Add index signature for string keys
    }
    
    // Ensure value is a valid number
    let numericValue: number;
    if (typeof billingData.value === 'string') {
      numericValue = parseFloat(billingData.value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    } else if (typeof billingData.value === 'number') {
      numericValue = isNaN(billingData.value) ? 0 : billingData.value;
    } else {
      numericValue = 0;
    }
    
    const formattedData: FormattedData = {
      name: billingData.customer?.name || '',
      cpfCnpj: billingData.customer?.cpfCnpj?.replace(/[^0-9]/g, '') || '', // Remove non-numeric chars
      email: billingData.customer?.email || '',
      phone: billingData.customer?.phone?.replace(/[^0-9]/g, '') || '', // Remove non-numeric chars
      orderId: billingData.orderId || '',
      value: numericValue,
      description: billingData.description || `Pedido #${billingData.orderId || 'novo'}`
    };
    
    // Validate required fields
    const requiredFields = ['name', 'cpfCnpj', 'email', 'phone', 'orderId', 'value'];
    const missingFields = requiredFields.filter(field => !formattedData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }
    
    // Adicionar um ID único para evitar solicitações duplicadas
    const requestId = `${formattedData.orderId}-${Date.now()}`;
    formattedData.requestId = requestId;
    console.log(`Request ID único gerado para evitar duplicação: ${requestId}`);
    
    console.log('Making API request to create-asaas-customer endpoint');
    
    const response = await fetch('/api/create-asaas-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from server:', errorText);
      throw new Error(`Failed to generate PIX payment: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('API response data:', responseData);
    
    // Validate QR code image format
    let validQrCodeImage = responseData.qrCodeImage || '';
    
    // Verify if the QR code is a valid data URL
    if (validQrCodeImage && !validQrCodeImage.startsWith('data:image')) {
      console.warn('QR code image is not in the expected format, attempting to fix');
      
      // Try to fix it by adding data:image/png;base64, prefix if missing
      if (validQrCodeImage.match(/^[A-Za-z0-9+/=]+$/)) {
        validQrCodeImage = `data:image/png;base64,${validQrCodeImage}`;
        console.log('Fixed QR code image by adding proper prefix');
      } else {
        console.error('QR code image could not be fixed, it will not be displayed');
        validQrCodeImage = '';
      }
    }
    
    // Debug the QR code data for troubleshooting
    console.log("QR Code Image:", validQrCodeImage ? 
      `Received (${validQrCodeImage.substring(0, 30)}...)` : "Not received");
    console.log("QR Code:", responseData.qrCode ? 
      `Received (${responseData.qrCode.substring(0, 30)}...)` : "Not received");
    console.log("Copy Paste Key:", responseData.copyPasteKey ? 
      `Received (${responseData.copyPasteKey.substring(0, 30)}...)` : "Not received");
    
    // Ensure all expected properties exist with default values if missing
    // Most importantly, ensure the value is a proper number
    const safeValue = typeof responseData.value === 'number' && !isNaN(responseData.value) ?
      responseData.value :
      (typeof responseData.value === 'string' ? parseFloat(responseData.value) || formattedData.value : formattedData.value);
      
    const safeResponseData = {
      ...responseData,
      qrCodeImage: validQrCodeImage,
      qrCode: responseData.qrCode || '',
      copyPasteKey: responseData.copyPasteKey || '',
      expirationDate: responseData.expirationDate || new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Default 30 minutes
      paymentId: responseData.paymentId || responseData.payment?.id || '',
      value: safeValue,
      status: responseData.status || 'PENDING',
      requestId: requestId // Incluir o ID único de requisição na resposta
    };
    
    console.log("Safe response data prepared:", {
      paymentId: safeResponseData.paymentId,
      value: safeResponseData.value,
      valueType: typeof safeResponseData.value,
      hasQRCode: !!safeResponseData.qrCode,
      hasQRImage: !!safeResponseData.qrCodeImage,
      requestId: safeResponseData.requestId
    });
    
    return safeResponseData;
  } catch (error) {
    console.error('Error generating PIX payment:', error);
    throw error;
  }
};
