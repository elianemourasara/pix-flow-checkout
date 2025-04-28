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
    const endpoint = `${apiUrl}/customers`;
    console.log(`Enviando requisição para ${endpoint}`);

    if (!apiKey) {
      throw new Error('Chave API do Asaas não foi fornecida');
    }

    if (!customerData.name || !customerData.cpfCnpj) {
      throw new Error('Nome ou CPF/CNPJ do cliente não foi fornecido');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // ✅ CORREÇÃO AQUI
      },
      body: JSON.stringify(customerData)
    });

    if (!response.ok) {
      let errorText = await response.text();
      console.error('Resposta de erro completa:', errorText);

      try {
        const errorData = JSON.parse(errorText);
        throw new AsaasApiError(`Erro ao criar cliente no Asaas: ${errorData.message || response.statusText}`, errorData);
      } catch (parseError) {
        throw new AsaasApiError(`Erro ao criar cliente no Asaas: Status ${response.status} - ${errorText}`, { raw: errorText });
      }
    }

    const responseData = await response.json();
    console.log('Cliente criado com sucesso:', responseData.id);
    return responseData;
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
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
    console.log(`Enviando requisição para ${endpoint}`);

    if (!apiKey) {
      throw new Error('Chave API do Asaas não foi fornecida');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // ✅ CORREÇÃO AQUI
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      let errorText = await response.text();
      console.error('Resposta de erro completa (pagamento):', errorText);

      try {
        const errorData = JSON.parse(errorText);
        throw new AsaasApiError(`Erro ao criar pagamento PIX no Asaas: ${errorData.message || response.statusText}`, errorData);
      } catch (parseError) {
        throw new AsaasApiError(`Erro ao criar pagamento PIX no Asaas: Status ${response.status} - ${errorText}`, { raw: errorText });
      }
    }

    const responseData = await response.json();
    console.log('Pagamento criado com sucesso:', responseData.id);
    return responseData;
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
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
    console.log(`Requesting QR code for payment ID: ${paymentId}`);

    if (!apiKey) {
      throw new Error('Chave API do Asaas não foi fornecida');
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // ✅ CORREÇÃO AQUI
      }
    });

    if (!response.ok) {
      let errorText = await response.text();
      console.error('Resposta de erro completa (QR Code):', errorText);

      try {
        const errorData = JSON.parse(errorText);
        throw new AsaasApiError(`Erro ao buscar QR Code PIX: ${errorData.message || response.statusText}`, errorData);
      } catch (parseError) {
        throw new AsaasApiError(`Erro ao buscar QR Code PIX: Status ${response.status} - ${errorText}`, { raw: errorText });
      }
    }

    const data = await response.json();
    console.log('QR code recebido com sucesso.');
    return data;
  } catch (error) {
    console.error('Erro ao buscar QR Code:', error);
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
