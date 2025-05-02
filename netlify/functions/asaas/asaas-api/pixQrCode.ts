
import { AsaasPixQrCodeResponse, AsaasApiError } from '../types';

export async function getAsaasPixQrCode(
  paymentId: string, 
  apiKey: string,
  apiUrl: string = 'https://sandbox.asaas.com/api/v3'
): Promise<AsaasPixQrCodeResponse> {
  try {
    const endpoint = `${apiUrl}/payments/${paymentId}/pixQrCode`;
    console.log(`[getAsaasPixQrCode] Requesting QR code for payment ID: ${paymentId}`);
    console.log(`[getAsaasPixQrCode] URL completa: ${endpoint}`);
    console.log(`[getAsaasPixQrCode] Primeiros caracteres da API key: ${apiKey.substring(0, 8)}...`);

    if (!apiKey) {
      throw new Error('Chave API do Asaas não foi fornecida');
    }

    // Use node-fetch with require to ensure compatibility
    const fetch = require('node-fetch');
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      let errorText = await response.text();
      console.error('[getAsaasPixQrCode] Resposta de erro completa (QR Code):', errorText);
      console.error('[getAsaasPixQrCode] Status HTTP:', response.status);
      console.error('[getAsaasPixQrCode] Status Text:', response.statusText);

      try {
        const errorData = JSON.parse(errorText);
        throw new AsaasApiError(`Erro ao buscar QR Code PIX: ${errorData.message || response.statusText}`, errorData);
      } catch (parseError) {
        throw new AsaasApiError(`Erro ao buscar QR Code PIX: Status ${response.status} - ${errorText}`, { raw: errorText });
      }
    }

    const data = await response.json();
    console.log('[getAsaasPixQrCode] QR code recebido com sucesso.');
    return data;
  } catch (error) {
    console.error('[getAsaasPixQrCode] Erro ao buscar QR Code:', error);
    throw error;
  }
}
