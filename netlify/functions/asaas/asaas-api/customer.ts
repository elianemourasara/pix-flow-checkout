
import { AsaasCustomerRequest, AsaasCustomerResponse, AsaasApiError } from '../types';
import { sanitizeApiKey, validateAuthHeader, testApiKeyEndpoint } from './apiKeyUtils';

export async function createAsaasCustomer(
  data: AsaasCustomerRequest, 
  apiKey: string,
  apiUrl: string = 'https://sandbox.asaas.com/api/v3'
): Promise<AsaasCustomerResponse> {
  const formattedPhone = data.phone ? data.phone.replace(/\D/g, '') : '';

  const customerData = {
    name: data.name,
    cpfCnpj: data.cpfCnpj ? data.cpfCnpj.replace(/\D/g, '') : '',
    email: data.email || '',
    phone: formattedPhone,
    mobilePhone: formattedPhone,
    notificationDisabled: false
  };

  try {
    console.log('==================== INÍCIO DA OPERAÇÃO createAsaasCustomer ====================');
    console.log(`[createAsaasCustomer] Ambiente: ${apiUrl}`);
    console.log(`[createAsaasCustomer] Comprimento da chave original: ${apiKey.length}`);
    
    // Análise inicial da chave API bruta
    console.log(`[createAsaasCustomer] Caracteres iniciais da chave bruta: ${apiKey.substring(0, 8)}...`);
    console.log(`[createAsaasCustomer] Caracteres finais da chave bruta: ...${apiKey.substring(apiKey.length - 4)}`);
    
    // Verificar se a chave contém o prefixo correto do Asaas
    const hasCorrectPrefix = apiKey.startsWith('$aact_');
    console.log(`[createAsaasCustomer] Chave tem prefixo correto ($aact_): ${hasCorrectPrefix}`);
    
    // Sanitizar a apiKey, removendo espaços e caracteres problemáticos
    console.log('[createAsaasCustomer] Sanitizando chave API...');
    const sanitizedApiKey = sanitizeApiKey(apiKey);
    
    // Testar se a chave API está válida antes de prosseguir
    console.log('[createAsaasCustomer] Testando chave API antes de criar cliente...');
    const isApiKeyValid = await testApiKeyEndpoint(sanitizedApiKey, apiUrl);
    
    if (!isApiKeyValid) {
      console.error('[createAsaasCustomer] ERRO CRÍTICO: Teste de chave API falhou. Verifique a chave e permissões.');
      throw new Error('Chave API do Asaas inválida ou sem permissões necessárias');
    }
    
    const endpoint = `${apiUrl}/customers`;
    console.log(`[createAsaasCustomer] Verificando parâmetros antes da requisição:`);
    console.log(`[createAsaasCustomer] URL completa: ${endpoint}`);
    console.log(`[createAsaasCustomer] Nome do cliente: ${customerData.name}`);
    console.log(`[createAsaasCustomer] Email: ${customerData.email}`);
    console.log(`[createAsaasCustomer] CPF/CNPJ (primeiros dígitos): ${customerData.cpfCnpj.substring(0, 4)}...`);

    if (!sanitizedApiKey) {
      throw new Error('Chave API do Asaas não foi fornecida');
    }

    if (!customerData.name || !customerData.cpfCnpj) {
      throw new Error('Nome ou CPF/CNPJ do cliente não foi fornecido');
    }

    // Verifica e cria o header de autorização com a chave sanitizada
    console.log('[createAsaasCustomer] Gerando header de Authorization...');
    const authHeader = validateAuthHeader(sanitizedApiKey);

    // Envio da requisição real
    console.log('[createAsaasCustomer] Enviando requisição HTTP para criar cliente...');
    // Use node-fetch with require to ensure compatibility
    const fetch = require('node-fetch');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(customerData)
    });

    // Exibir informações sobre a resposta HTTP
    console.log(`[createAsaasCustomer] Status da resposta: ${response.status} ${response.statusText}`);
    console.log(`[createAsaasCustomer] Headers da resposta: ${JSON.stringify(Object.fromEntries([...response.headers]))}`);

    if (!response.ok) {
      let errorText = await response.text();
      console.error('[createAsaasCustomer] Resposta de erro completa:', errorText);
      console.error('[createAsaasCustomer] Status HTTP:', response.status);
      console.error('[createAsaasCustomer] Status Text:', response.statusText);
      console.error('[createAsaasCustomer] Headers da resposta:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));

      try {
        const errorData = JSON.parse(errorText);
        throw new AsaasApiError(`Erro ao criar cliente no Asaas: ${errorData.message || response.statusText}`, errorData);
      } catch (parseError) {
        throw new AsaasApiError(`Erro ao criar cliente no Asaas: Status ${response.status} - ${errorText || response.statusText}`, { raw: errorText });
      }
    }

    const responseData = await response.json();
    console.log('[createAsaasCustomer] Cliente criado com sucesso:', responseData.id);
    console.log('==================== FIM DA OPERAÇÃO createAsaasCustomer ====================');
    return responseData;
  } catch (error) {
    console.error('[createAsaasCustomer] Erro ao criar cliente:', error);
    throw error;
  }
}
