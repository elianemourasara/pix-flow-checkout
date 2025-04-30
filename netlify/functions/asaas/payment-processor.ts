
import { AsaasCustomerRequest, SupabasePaymentData } from './types';
import { createAsaasCustomer, createAsaasPayment, getAsaasPixQrCode } from './asaas-api';
import { savePaymentData, updateOrderAsaasPaymentId } from './supabase-operations';
import { testApiKey } from './get-asaas-api-key';
import * as https from 'https';

/**
 * Função utilitária para validar a chave antes de prosseguir
 */
async function validateApiKey(apiKey: string, apiUrl: string): Promise<boolean> {
  console.log('[validateApiKey] Validando chave API antes de prosseguir...');
  console.log(`[validateApiKey] Testando chave: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  
  const isSandbox = apiUrl.includes('sandbox');
  
  // Teste com agente HTTPS e configurações personalizadas
  try {
    const agent = new https.Agent({
      rejectUnauthorized: true,
      keepAlive: true,
      timeout: 30000
    });
    
    // Teste em endpoint menos restrito (/status em vez de /customers)
    const testUrl = `${apiUrl}/status`;
    console.log(`[validateApiKey] Testando conexão em: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Mozilla/5.0 Lovable/Netlify',
        'Accept': '*/*',
        'Cache-Control': 'no-cache'
      },
      // @ts-ignore - Tipagem incompatível entre node-fetch e fetch nativo
      agent,
      timeout: 30000
    });
    
    console.log(`[validateApiKey] Status da resposta: ${response.status}`);
    console.log(`[validateApiKey] Headers da resposta: ${JSON.stringify(Object.fromEntries([...response.headers]))}`);
    
    const responseText = await response.text();
    console.log(`[validateApiKey] Corpo da resposta: ${responseText.substring(0, 200)}...`);
    
    if (response.ok) {
      console.log('[validateApiKey] Chave API validada com sucesso!');
      return true;
    } else {
      console.error(`[validateApiKey] Erro na validação: Status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('[validateApiKey] Erro durante validação:', error);
    return false;
  }
}

// Função para processar o pagamento com a chave API fornecida
export async function processPaymentFlow(
  requestData: AsaasCustomerRequest,
  apiKey: string,
  supabase: any,
  apiUrl: string
) {
  console.log('==================== INÍCIO DO PROCESSAMENTO DE PAGAMENTO ====================');
  console.log(`[processPaymentFlow] Iniciando fluxo de pagamento com API URL: ${apiUrl}`);
  console.log(`[processPaymentFlow] Valor do pagamento: ${requestData.value}`);
  console.log(`[processPaymentFlow] Primeiros caracteres da chave API: ${apiKey.substring(0, 8)}...`);
  console.log(`[processPaymentFlow] Últimos caracteres da chave API: ...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`[processPaymentFlow] Comprimento da chave API: ${apiKey.length} caracteres`);
  
  // Verificar formato da chave
  if (!apiKey.startsWith('$aact_')) {
    console.error(`[processPaymentFlow] ALERTA CRÍTICO: A chave API não começa com "$aact_", formato possivelmente inválido`);
  }
  
  // Verificar se a chave contém espaços
  if (apiKey.includes(' ')) {
    console.error('[processPaymentFlow] ALERTA CRÍTICO: A chave API contém espaços, o que causará falha na autenticação');
    // Remover espaços (não deveria ser necessário pois já é feito na função getAsaasApiKey)
    apiKey = apiKey.replace(/\s/g, '');
    console.log(`[processPaymentFlow] Chave corrigida, novo comprimento: ${apiKey.length}`);
  }
  
  // Verificar existência da chave API
  if (!apiKey) {
    console.error('[processPaymentFlow] ERRO CRÍTICO: Chave API do Asaas não fornecida');
    throw new Error('Chave API do Asaas não configurada corretamente');
  }
  
  // Verificar se a URL da API foi fornecida
  if (!apiUrl) {
    console.error('[processPaymentFlow] ERRO CRÍTICO: URL da API Asaas não fornecida');
    throw new Error('URL da API Asaas não configurada corretamente');
  }
  
  // Verificar formato da URL da API
  const expectedProductionUrl = 'https://api.asaas.com/api/v3';
  const expectedSandboxUrl = 'https://sandbox.asaas.com/api/v3';
  
  if (apiUrl !== expectedProductionUrl && apiUrl !== expectedSandboxUrl) {
    console.error(`[processPaymentFlow] ALERTA: URL da API não corresponde aos padrões esperados: ${apiUrl}`);
    console.error(`[processPaymentFlow] URLs esperadas: ${expectedProductionUrl} ou ${expectedSandboxUrl}`);
  }
  
  try {
    // Logar a chave COMPLETA para diagnóstico - REMOVER EM PRODUÇÃO
    console.log('[processPaymentFlow] CHAVE COMPLETA PARA DIAGNÓSTICO (REMOVER EM PRODUÇÃO):', apiKey);
    
    // Validar a chave API antes de prosseguir com teste independente
    const isKeyValid = await validateApiKey(apiKey, apiUrl);
    if (!isKeyValid) {
      console.error('[processPaymentFlow] ERRO: A chave API não é válida. Considere verificar ou gerar uma nova chave.');
      console.error('[processPaymentFlow] PROSSEGUINDO MESMO COM CHAVE INVÁLIDA PARA DIAGNÓSTICO!');
    }
    
    // Get email configuration
    const { data: emailConfig } = await supabase
      .from('asaas_email_config')
      .select('use_temp_email, temp_email')
      .maybeSingle();
      
    // If temporary email is configured and enabled, use it instead of customer's email
    if (emailConfig?.use_temp_email && emailConfig?.temp_email) {
      console.log('[processPaymentFlow] Using temporary email:', emailConfig.temp_email);
      console.log('[processPaymentFlow] Original customer email:', requestData.email);
      requestData.email = emailConfig.temp_email;
    }
    
    // Validar todos os campos obrigatórios antes de continuar
    if (!requestData.name || !requestData.cpfCnpj || !requestData.orderId || !requestData.value) {
      console.error('[processPaymentFlow] ERRO: Dados de cliente insuficientes');
      console.error('[processPaymentFlow] Dados recebidos:', {
        name: requestData.name ? 'Presente' : 'Ausente',
        cpfCnpj: requestData.cpfCnpj ? 'Presente' : 'Ausente',
        orderId: requestData.orderId ? 'Presente' : 'Ausente',
        value: requestData.value ? 'Presente' : 'Ausente'
      });
      throw new Error('Dados de cliente insuficientes para criação no Asaas. Verifique name, cpfCnpj, orderId e value.');
    }
    
    // Log completo dos dados de request para diagnóstico
    console.log('[processPaymentFlow] Dados completos da requisição (sanitizados):', {
      name: requestData.name,
      cpfCnpjPartial: requestData.cpfCnpj ? `${requestData.cpfCnpj.substring(0, 4)}...` : 'não fornecido',
      email: requestData.email,
      phone: requestData.phone,
      orderId: requestData.orderId,
      value: requestData.value,
      description: requestData.description
    });
    
    console.log(`[processPaymentFlow] Chamando API Asaas (${apiUrl}) para criar cliente...`);
    
    // 1. Create customer in Asaas
    try {
      // Teste manual da API antes de chamar createAsaasCustomer
      console.log('[processPaymentFlow] Teste manual da API antes de criar cliente...');
      
      const agent = new https.Agent({
        rejectUnauthorized: true,
        keepAlive: true,
        timeout: 30000
      });
      
      // Teste em endpoint de status para verificar conectividade antes de continuar
      try {
        const testResponse = await fetch(`${apiUrl}/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'Mozilla/5.0 Lovable/Netlify Test',
            'Accept': '*/*'
          },
          // @ts-ignore - Tipagem incompatível entre node-fetch e fetch nativo
          agent
        });
        
        console.log(`[processPaymentFlow] Teste de conectividade - Status: ${testResponse.status}`);
        if (!testResponse.ok) {
          console.error('[processPaymentFlow] ALERTA: Teste de conectividade falhou, mas tentaremos criar o cliente mesmo assim');
        }
      } catch (testError) {
        console.error('[processPaymentFlow] Erro no teste de conectividade:', testError);
      }
      
      console.log('[processPaymentFlow] Tentando criar cliente no Asaas...');
      const customer = await createAsaasCustomer(requestData, apiKey, apiUrl);
      console.log('[processPaymentFlow] Cliente criado no Asaas com sucesso:', customer);
      
      // 2. Create PIX payment
      const description = requestData.description || `Pedido #${requestData.orderId}`;
      
      console.log('[processPaymentFlow] Tentando criar pagamento no Asaas...');
      const payment = await createAsaasPayment(
        customer.id, 
        requestData.value, 
        description, 
        requestData.orderId,
        apiKey,
        apiUrl
      );
      console.log('[processPaymentFlow] Pagamento criado no Asaas:', payment);
      
      // 3. Get PIX QR Code
      console.log('[processPaymentFlow] Obtendo QR Code para pagamento...');
      const pixQrCode = await getAsaasPixQrCode(payment.id, apiKey, apiUrl);
      console.log('[processPaymentFlow] QR Code PIX recebido:', {
        success: pixQrCode.success,
        payloadLength: pixQrCode.payload ? pixQrCode.payload.length : 0,
        encodedImageLength: pixQrCode.encodedImage ? pixQrCode.encodedImage.length : 0
      });
      
      // 4. Save payment data to Supabase
      const paymentData: SupabasePaymentData = {
        order_id: requestData.orderId,
        payment_id: payment.id,
        status: payment.status,
        amount: requestData.value,
        qr_code: pixQrCode.payload,
        qr_code_image: pixQrCode.encodedImage,
        copy_paste_key: pixQrCode.payload,
        expiration_date: pixQrCode.expirationDate
      };
      
      const saveResult = await savePaymentData(supabase, paymentData);
      console.log('[processPaymentFlow] Dados salvos no Supabase:', saveResult);
      
      // 5. Update order with Asaas payment ID
      await updateOrderAsaasPaymentId(supabase, requestData.orderId, payment.id);
      
      console.log('==================== FIM DO PROCESSAMENTO DE PAGAMENTO (SUCESSO) ====================');
      
      // Return formatted response data
      return {
        customer,
        payment,
        pixQrCode,
        paymentData: saveResult,
        qrCodeImage: pixQrCode.encodedImage,
        qrCode: pixQrCode.payload,
        copyPasteKey: pixQrCode.payload,
        expirationDate: pixQrCode.expirationDate
      };
    } catch (error) {
      // Capturar e registrar erros específicos
      if (error.name === 'AsaasApiError') {
        console.error('[processPaymentFlow] Erro da API Asaas:', error.message, error.details);
      }
      
      console.log('==================== FIM DO PROCESSAMENTO DE PAGAMENTO (ERRO) ====================');
      throw error;
    }
  } catch (error) {
    console.error('[processPaymentFlow] Erro no processamento do pagamento:', error);
    console.log('==================== FIM DO PROCESSAMENTO DE PAGAMENTO (ERRO) ====================');
    throw error;
  }
}
