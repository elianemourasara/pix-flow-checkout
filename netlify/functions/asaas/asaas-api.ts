
import { 
  AsaasCustomerRequest, 
  AsaasCustomerResponse, 
  AsaasPaymentResponse,
  AsaasPixQrCodeResponse,
  AsaasApiError
} from './types';

// Add import for node-fetch at the top (will be added by our system)
const fetch = require('node-fetch');

/**
 * Sanitiza a chave API para garantir que não contenha caracteres problemáticos
 * @param apiKey Chave API a ser sanitizada
 */
function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  console.log(`[sanitizeApiKey] Sanitizando chave API (tamanho original: ${apiKey.length})`);
  console.log(`[sanitizeApiKey] Primeiros 8 caracteres: ${apiKey.substring(0, 8)}...`);
  console.log(`[sanitizeApiKey] Últimos 4 caracteres: ...${apiKey.substring(apiKey.length - 4)}`);
  
  // Converter para string caso não seja
  let sanitized = String(apiKey);
  
  // Verificar se há caracteres de controle antes da sanitização
  const controlCharsRegex = /[\x00-\x1F\x7F-\x9F]/g;
  if (controlCharsRegex.test(sanitized)) {
    console.warn('[sanitizeApiKey] ALERTA: Caracteres de controle detectados na chave API');
    // Logar quais caracteres foram encontrados (como códigos Unicode)
    const matches = sanitized.match(controlCharsRegex);
    if (matches) {
      console.warn(`[sanitizeApiKey] Caracteres encontrados: ${matches.map(c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`).join(', ')}`);
    }
  }
  
  // Remove espaços no início e fim
  let previousLength = sanitized.length;
  sanitized = sanitized.trim();
  if (previousLength !== sanitized.length) {
    console.warn(`[sanitizeApiKey] ALERTA: Espaços no início/fim removidos. Antes: ${previousLength}, Depois: ${sanitized.length}`);
  }
  
  // Remove quebras de linha ou tabs que podem ter sido acidentalmente copiados
  previousLength = sanitized.length;
  sanitized = sanitized.replace(/[\n\r\t]/g, '');
  if (previousLength !== sanitized.length) {
    console.warn(`[sanitizeApiKey] ALERTA: Quebras de linha/tabs removidos. Antes: ${previousLength}, Depois: ${sanitized.length}`);
  }
  
  // Verifica caracteres Unicode que não são visíveis mas poderiam estar presentes
  previousLength = sanitized.length;
  const invisibleChars = /[\u200B-\u200D\uFEFF]/g;
  if (invisibleChars.test(sanitized)) {
    console.warn('[sanitizeApiKey] ALERTA: Caracteres unicode invisíveis detectados e removidos');
    sanitized = sanitized.replace(invisibleChars, '');
    console.warn(`[sanitizeApiKey] Após remoção de caracteres invisíveis: Antes: ${previousLength}, Depois: ${sanitized.length}`);
  }
  
  // Verifica se a chave contém aspas ou outros caracteres que possam afetar o header
  if (sanitized.includes('"') || sanitized.includes("'") || sanitized.includes('\\')) {
    console.warn('[sanitizeApiKey] ALERTA: A chave API contém caracteres que podem causar problemas');
  }
  
  // Verificar formato básico da chave Asaas (começa com $aact_)
  if (!sanitized.startsWith('$aact_')) {
    console.error('[sanitizeApiKey] ERRO CRÍTICO: A chave API não segue o formato padrão $aact_*');
  }
  
  console.log(`[sanitizeApiKey] Chave sanitizada (tamanho final: ${sanitized.length})`);
  return sanitized;
}

/**
 * Verifica se o Authorization header está formatado corretamente
 * @param apiKey Chave API sanitizada
 */
function validateAuthHeader(apiKey: string): string {
  console.log('[validateAuthHeader] Validando formato do header de autorização');
  
  // Verificar se a chave API foi fornecida
  if (!apiKey) {
    console.error('[validateAuthHeader] ERRO CRÍTICO: Chave API vazia');
    throw new Error('Chave API não fornecida');
  }
  
  // Verificar o formato da chave
  if (!apiKey.startsWith('$aact_')) {
    console.error('[validateAuthHeader] ERRO CRÍTICO: Formato da chave API inválido - não começa com $aact_');
  }
  
  const authHeader = `Bearer ${apiKey}`;
  
  // Verificar se o header tem um comprimento razoável
  if (authHeader.length < 20) {
    console.error('[validateAuthHeader] ERRO: Authorization header muito curto:', authHeader.length);
    throw new Error('Authorization header inválido - muito curto');
  }
  
  // Verifica se o formato do header está correto
  if (!authHeader.startsWith('Bearer ') || apiKey.length < 10) {
    console.error('[validateAuthHeader] ERRO: Authorization header mal formatado');
    throw new Error('Authorization header inválido - formato incorreto');
  }
  
  console.log(`[validateAuthHeader] Header válido: Bearer ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`[validateAuthHeader] Comprimento total do header: ${authHeader.length}`);
  
  return authHeader;
}

/**
 * Testa uma chave API diretamente antes de tentar usá-la
 * @param apiKey Chave API já sanitizada
 * @param apiUrl URL base da API
 */
async function testApiKeyEndpoint(apiKey: string, apiUrl: string): Promise<boolean> {
  const testEndpoint = `${apiUrl}/status`;
  console.log(`[testApiKeyEndpoint] Testando chave API no endpoint: ${testEndpoint}`);
  console.log(`[testApiKeyEndpoint] Primeiros 8 caracteres da chave: ${apiKey.substring(0, 8)}...`);
  
  try {
    const authHeader = validateAuthHeader(apiKey);
    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });
    
    console.log(`[testApiKeyEndpoint] Status da resposta: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('[testApiKeyEndpoint] Chave API VÁLIDA!');
      return true;
    } else {
      const errorText = await response.text();
      console.error('[testApiKeyEndpoint] Erro no teste da chave API:', errorText);
      console.error('[testApiKeyEndpoint] Status HTTP:', response.status);
      console.error('[testApiKeyEndpoint] Headers da resposta:', JSON.stringify(Object.fromEntries([...response.headers])));
      return false;
    }
  } catch (error) {
    console.error('[testApiKeyEndpoint] Exceção no teste da chave API:', error);
    return false;
  }
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
    
    // Avisos sobre possíveis problemas com a chave
    if (sanitizedApiKey !== apiKey) {
      console.warn('[createAsaasCustomer] ALERTA: A chave API precisou ser sanitizada');
      console.log(`[createAsaasCustomer] Comprimento antes: ${apiKey.length}, depois: ${sanitizedApiKey.length}`);
      
      // Logar detalhes mais específicos sobre o que mudou
      if (apiKey.trim() !== apiKey) {
        console.warn('[createAsaasCustomer] ALERTA: A chave original continha espaços no início/fim');
      }
      
      const newlineRegex = /[\n\r]/;
      if (newlineRegex.test(apiKey)) {
        console.warn('[createAsaasCustomer] ALERTA: A chave original continha quebras de linha');
      }
      
      const tabRegex = /\t/;
      if (tabRegex.test(apiKey)) {
        console.warn('[createAsaasCustomer] ALERTA: A chave original continha caracteres de tabulação');
      }
    }
    
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
    console.log(`[createAsaasCustomer] Primeiros caracteres da API key sanitizada: ${sanitizedApiKey.substring(0, 8)}...`);
    console.log(`[createAsaasCustomer] Últimos caracteres da API key sanitizada: ...${sanitizedApiKey.substring(sanitizedApiKey.length - 4)}`);
    console.log(`[createAsaasCustomer] Comprimento da API key sanitizada: ${sanitizedApiKey.length} caracteres`);

    if (!sanitizedApiKey) {
      throw new Error('Chave API do Asaas não foi fornecida');
    }

    if (!customerData.name || !customerData.cpfCnpj) {
      throw new Error('Nome ou CPF/CNPJ do cliente não foi fornecido');
    }

    // Verifica e cria o header de autorização com a chave sanitizada
    console.log('[createAsaasCustomer] Gerando header de Authorization...');
    const authHeader = validateAuthHeader(sanitizedApiKey);
    console.log(`[createAsaasCustomer] Authorization header (início): Bearer ${sanitizedApiKey.substring(0, 8)}...`);
    console.log(`[createAsaasCustomer] Authorization header (final): ...${sanitizedApiKey.substring(sanitizedApiKey.length - 4)}`);
    console.log(`[createAsaasCustomer] Authorization header comprimento total: ${authHeader.length}`);

    // Teste para detecção de caracteres especiais ou problemas
    const specialCharsRegex = /[^\w\-\._$]/g;
    const hasSpecialChars = specialCharsRegex.test(sanitizedApiKey);
    console.log(`[createAsaasCustomer] Caracteres especiais na chave? ${hasSpecialChars ? 'SIM' : 'NÃO'}`);
    
    if (hasSpecialChars) {
      const matches = sanitizedApiKey.match(specialCharsRegex);
      if (matches) {
        console.log(`[createAsaasCustomer] Caracteres especiais encontrados: ${JSON.stringify(matches)}`);
        console.log(`[createAsaasCustomer] Posição dos caracteres especiais: ${matches.map(char => sanitizedApiKey.indexOf(char)).join(', ')}`);
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
    console.log('[createAsaasCustomer] Enviando requisição HTTP para criar cliente...');
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

export async function createAsaasPayment(
  customerId: string, 
  value: number, 
  description: string,
  externalReference: string,
  apiKey: string,
  apiUrl: string = 'https://sandbox.asaas.com/api/v3',
  checkoutSession: string = '' // Add checkoutSession parameter
): Promise<AsaasPaymentResponse> {
  const today = new Date();
  const dueDate = today.toISOString().split('T')[0];

  const paymentData: any = {
    customer: customerId,
    billingType: 'PIX',
    value: value,
    dueDate: dueDate,
    description: description,
    externalReference: externalReference,
    postalService: false
  };

  // Add checkoutSession if provided
  if (checkoutSession) {
    paymentData.checkoutSession = checkoutSession;
    console.log(`[createAsaasPayment] Adding checkoutSession ID: ${checkoutSession}`);
  }

  try {
    const endpoint = `${apiUrl}/payments`;
    console.log(`[createAsaasPayment] Enviando requisição para ${endpoint}`);
    console.log(`[createAsaasPayment] Primeiros caracteres da API key: ${apiKey.substring(0, 8)}...`);
    console.log(`[createAsaasPayment] Dados do pagamento:`, {
      customer_id: customerId,
      value: value,
      description: description,
      externalReference: externalReference,
      checkoutSession: checkoutSession || 'não fornecido'
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
