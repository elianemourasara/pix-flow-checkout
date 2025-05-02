
import { AsaasPaymentResponse, AsaasApiError } from '../types';

export async function createAsaasPayment(
  customerId: string, 
  value: number, 
  description: string,
  externalReference: string,
  apiKey: string,
  apiUrl: string = 'https://sandbox.asaas.com/api/v3'
): Promise<AsaasPaymentResponse> {
  const today = new Date();
  const dueDate = today.toISOString().split('T')[0];

  const paymentData = {
    customer: customerId,
    billingType: 'PIX',
    value: value,
    dueDate: dueDate,
    description: description,
    externalReference: externalReference,
    postalService: false
  };

  try {
    const endpoint = `${apiUrl}/payments`;
    console.log(`[createAsaasPayment] Enviando requisição para ${endpoint}`);
    console.log(`[createAsaasPayment] Primeiros caracteres da API key: ${apiKey.substring(0, 8)}...`);
    console.log(`[createAsaasPayment] Dados do pagamento:`, {
      customer_id: customerId,
      value: value,
      description: description,
      externalReference: externalReference
    });

    if (!apiKey) {
      throw new Error('Chave API do Asaas não foi fornecida');
    }

    // Use node-fetch with require to ensure compatibility
    const fetch = require('node-fetch');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      let errorText = await response.text();
      console.error('[createAsaasPayment] Resposta de erro completa (pagamento):', errorText);
      console.error('[createAsaasPayment] Status HTTP:', response.status);
      console.error('[createAsaasPayment] Status Text:', response.statusText);

      try {
        const errorData = JSON.parse(errorText);
        throw new AsaasApiError(`Erro ao criar pagamento PIX no Asaas: ${errorData.message || response.statusText}`, errorData);
      } catch (parseError) {
        throw new AsaasApiError(`Erro ao criar pagamento PIX no Asaas: Status ${response.status} - ${errorText}`, { raw: errorText });
      }
    }

    const responseData = await response.json();
    console.log('[createAsaasPayment] Pagamento criado com sucesso:', responseData.id);
    return responseData;
  } catch (error) {
    console.error('[createAsaasPayment] Erro ao criar pagamento:', error);
    throw error;
  }
}
