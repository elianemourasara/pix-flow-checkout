import { 
  AsaasCustomerRequest, 
  AsaasCustomerResponse, 
  AsaasPaymentResponse,
  AsaasPixQrCodeResponse,
  AsaasApiError
} from './types';

/**
 * Sanitiza a chave API para garantir que não contenha caracteres problemáticos
 * @param apiKey Chave API a ser sanitizada
 */
function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  // Remove espaços no início e fim
  let sanitized = apiKey.trim();
  
  // Remove quebras de linha ou tabs que podem ter sido acidentalmente copiados
  sanitized = sanitized.replace(/[\n\r\t]/g, '');
  
  // Verifica se a chave contém aspas ou outros caracteres que possam afetar o header
  if (sanitized.includes('"') || sanitized.includes("'") || sanitized.includes('\\')) {
    console.warn('[sanitizeApiKey] ALERTA: A chave API contém caracteres que podem causar problemas');
  }
  
  return sanitized;
}

/**
 * Verifica se o Authorization header está formatado corretamente
 * @param apiKey Chave API sanitizada
 */
function validateAuthHeader(apiKey: string): string {
  const authHeader = `Bearer ${apiKey}`;
  
  // Verifica se o header tem um comprimento razoável
  if (authHeader.length < 20) {
    console.error('[validateAuthHeader] ERRO: Authorization header muito curto:', authHeader.length);
  }
  
  // Verifica se o formato do header está correto
  if (!authHeader.startsWith('Bearer ') || apiKey.length < 10) {
    console.error('[validateAuthHeader] ERRO: Authorization header mal formatado');
  }
  
  return authHeader;
}

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
    // Sanitizar a apiKey, removendo espaços e caracteres problemáticos
    const sanitizedApiKey = sanitizeApiKey(apiKey);
    
    // Avisos sobre possíveis problemas com a chave
    if (sanitizedApiKey !== apiKey) {
      console.warn('[createAsaasCustomer] ALERTA: A chave API precisou ser sanitizada');
      console.log(`[createAsaasCustomer] Comprimento antes: ${apiKey.length}, depois: ${sanitizedApiKey.length}`);
    }
    
    if (sanitizedApiKey.includes(' ')) {
      console.error('[createAsaasCustomer] ERRO: A chave API ainda contém espaços após sanitização');
    }
    
    const endpoint = `${apiUrl}/customers`;
    console.log(`[createAsaasCustomer] Verificando parâmetros antes da requisição:`);
    console.log(`[createAsaasCustomer] URL completa: ${endpoint}`);
    console.log(`[createAsaasCustomer] Nome do cliente: ${customerData.name}`);
    console.log(`[createAsaasCustomer] Email: ${customerData.email}`);
    console.log(`[createAsaasCustomer] CPF/CNPJ (primeiros dígitos): ${customerData.cpfCnpj.substring(0, 4)}...`);
    console.log(`[createAsaasCustomer] Primeiros caracteres da API key: ${sanitizedApiKey.substring(0, 8)}...`);
    console.log(`[createAsaasCustomer] Últimos caracteres da API key: ...${sanitizedApiKey.substring(sanitizedApiKey.length - 4)}`);
    console.log(`[createAsaasCustomer] Comprimento da API key: ${sanitizedApiKey.length} caracteres`);

    if (!sanitizedApiKey) {
      throw new Error('Chave API do Asaas não foi fornecida');
    }

    if (!customerData.name || !customerData.cpfCnpj) {
      throw new Error('Nome ou CPF/CNPJ do cliente não foi fornecido');
    }

    // Verifica e cria o header de autorização com a chave sanitizada
    const authHeader = validateAuthHeader(sanitizedApiKey);
    console.log(`[createAsaasCustomer] Authorization header (início): Bearer ${sanitizedApiKey.substring(0, 8)}...`);
    console.log(`[createAsaasCustomer] Authorization header (final): ...${sanitizedApiKey.substring(sanitizedApiKey.length - 4)}`);
    console.log(`[createAsaasCustomer] Authorization header comprimento total: ${authHeader.length}`);

    // Teste para detecção de caracteres especiais ou problemas
    const specialCharsRegex = /[^\w\-\._]/g;
    const hasSpecialChars = specialCharsRegex.test(sanitizedApiKey);
    console.log(`[createAsaasCustomer] Caracteres especiais na chave? ${hasSpecialChars ? 'SIM' : 'NÃO'}`);
    
    if (hasSpecialChars) {
      const matches = sanitizedApiKey.match(specialCharsRegex);
      if (matches) {
        console.log(`[createAsaasCustomer] Caracteres especiais encontrados: ${JSON.stringify(matches)}`);
      }
    }

    // Verificação final do endpoint antes da requisição
    console.log(`[createAsaasCustomer] Enviando requisição para: ${endpoint}`);
    console.log(`[createAsaasCustomer] Método: POST, Content-Type: application/json`);
    
    // Teste de conexão para verificar se a URL está acessível
    try {
      const testConnection = await fetch(apiUrl, {
        method: 'HEAD',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`[createAsaasCustomer] Teste de conexão com ${apiUrl}: ${testConnection.status} ${testConnection.statusText}`);
    } catch (connError) {
      console.error(`[createAsaasCustomer] ERRO ao testar conexão com ${apiUrl}:`, connError);
    }

    // Envio da requisição real
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
