
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
    
    // Novo log conforme solicitado
    console.log("[ASAAS] Criando cobrança com dados:", paymentData);
    console.log("[ASAAS] Endpoint:", endpoint);
    console.log("[ASAAS] Comprimento da chave API:", apiKey.length);
    console.log("[ASAAS] Verificando formato da chave: começa com $?", apiKey.startsWith('$'));
    console.log("[ASAAS] Verificando formato da chave: começa com aact_?", apiKey.startsWith('aact_'));

    if (!apiKey) {
      throw new Error('Chave API do Asaas não foi fornecida');
    }

    // Use node-fetch with require to ensure compatibility
    const fetch = require('node-fetch');
    
    // Log do header de autorização (primeiros e últimos caracteres)
    const authHeader = `Bearer ${apiKey}`;
    console.log(`[ASAAS] Header de autorização (início): Bearer ${apiKey.substring(0, 8)}...`);
    console.log(`[ASAAS] Header de autorização (fim): ...${apiKey.substring(apiKey.length - 4)}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Accept': 'application/json',
        'User-Agent': 'AsaasPaymentClient/1.0'
      },
      body: JSON.stringify(paymentData)
    });
    
    console.log(`[ASAAS] Status da resposta: ${response.status} ${response.statusText}`);
    console.log(`[ASAAS] Headers da resposta:`, JSON.stringify(Object.fromEntries([...response.headers])));

    if (!response.ok) {
      // Novo log conforme solicitado
      const rawText = await response.text();
      console.error("[ASAAS] Erro ao criar cobrança - Resposta bruta:", rawText);
      console.error("[ASAAS] Status HTTP:", response.status, response.statusText);
      
      try {
        const errorData = JSON.parse(rawText);
        console.error("[ASAAS] Detalhes do erro:", JSON.stringify(errorData));
        throw new AsaasApiError(`Erro ao criar pagamento PIX no Asaas: ${errorData.message || response.statusText}`, errorData);
      } catch (parseError) {
        console.error("[ASAAS] Erro ao parsear resposta como JSON:", parseError);
        throw new AsaasApiError(`Erro ao criar pagamento PIX no Asaas: Status ${response.status} - ${rawText}`, { raw: rawText });
      }
    }

    const responseData = await response.json();
    console.log('[createAsaasPayment] Pagamento criado com sucesso:', responseData.id);
    console.log('[ASAAS] Resposta completa:', JSON.stringify(responseData));
    return responseData;
  } catch (error) {
    console.error('[createAsaasPayment] Erro ao criar pagamento:', error);
    throw error;
  }
}
