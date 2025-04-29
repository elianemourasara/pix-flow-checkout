
import { 
  AsaasCustomerRequest, 
  AsaasCustomerResponse, 
  AsaasPaymentResponse,
  AsaasPixQrCodeResponse,
  AsaasApiError
} from './types';

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
    // Sanitizar a apiKey antes de usar, removendo espaços
    apiKey = apiKey ? apiKey.trim() : '';
    
    if (apiKey.includes(' ')) {
      console.warn('[createAsaasCustomer] ALERTA: A chave API ainda contém espaços após trim()');
    }
    
    const endpoint = `${apiUrl}/customers`;
    console.log(`[createAsaasCustomer] Verificando parâmetros antes da requisição:`);
    console.log(`[createAsaasCustomer] URL completa: ${endpoint}`);
    console.log(`[createAsaasCustomer] Nome do cliente: ${customerData.name}`);
    console.log(`[createAsaasCustomer] Email: ${customerData.email}`);
    console.log(`[createAsaasCustomer] CPF/CNPJ (primeiros dígitos): ${customerData.cpfCnpj.substring(0, 4)}...`);
    console.log(`[createAsaasCustomer] Primeiros caracteres da API key: ${apiKey.substring(0, 8)}...`);
    console.log(`[createAsaasCustomer] Comprimento da API key: ${apiKey.length} caracteres`);

    if (!apiKey) {
      throw new Error('Chave API do Asaas não foi fornecida');
    }

    if (!customerData.name || !customerData.cpfCnpj) {
      throw new Error('Nome ou CPF/CNPJ do cliente não foi fornecido');
    }

    // Exibe o header de autorização formatado (primeiros caracteres apenas)
    const authHeader = `Bearer ${apiKey}`;
    console.log(`[createAsaasCustomer] Authorization header (formato): ${authHeader.substring(0, 15)}...`);

    // Teste de chave inválida - exibe caracteres especiais ou problemas
    console.log(`[createAsaasCustomer] Caracteres especiais na chave? ${/[^\w\-\.]/.test(apiKey) ? 'SIM' : 'NÃO'}`);

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
    return responseData;
  } catch (error) {
    console.error('[createAsaasCustomer] Erro ao criar cliente:', error);
    throw error;
  }
}

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

export async function handleApiError(response: Response, operation: string) {
  let errorText;
  try {
    errorText = await response.text();
    console.log(`Texto de erro completo para ${operation}:`, errorText);
  } catch (e) {
    errorText = `Não foi possível obter texto de erro: ${e.message}`;
  }

  let errorData;
  try {
    errorData = JSON.parse(errorText);
  } catch (e) {
    errorData = { message: errorText };
  }

  console.error(`Erro ao ${operation}:`, {
    status: response.status,
    statusText: response.statusText,
    errorData: errorData
  });

  if (errorData && errorData.errors) {
    console.error('Detalhes específicos dos erros:', errorData.errors);
  }

  return errorData;
}
