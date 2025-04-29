
import { AsaasCustomerRequest, SupabasePaymentData } from './types';
import { createAsaasCustomer, createAsaasPayment, getAsaasPixQrCode } from './asaas-api';
import { savePaymentData, updateOrderAsaasPaymentId } from './supabase-operations';

// Função para processar o pagamento com a chave API fornecida
export async function processPaymentFlow(
  requestData: AsaasCustomerRequest,
  apiKey: string,
  supabase: any,
  apiUrl: string
) {
  console.log(`[processPaymentFlow] Iniciando fluxo de pagamento com API URL: ${apiUrl}`);
  console.log(`[processPaymentFlow] Valor do pagamento: ${requestData.value}`);
  console.log(`[processPaymentFlow] Primeiros caracteres da chave API: ${apiKey.substring(0, 8)}...`);
  console.log(`[processPaymentFlow] Comprimento da chave API: ${apiKey.length} caracteres`);
  
  // Verificar se a chave API foi fornecida
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
  
  // Verificar se a chave contém espaços
  if (apiKey.includes(' ')) {
    console.warn('[processPaymentFlow] ALERTA: A chave API contém espaços, sanitizando...');
    apiKey = apiKey.trim();
  }
  
  // Verificar se a chave contém caracteres especiais
  if (/[^\w\-\.]/.test(apiKey)) {
    console.warn('[processPaymentFlow] ALERTA: A chave API contém caracteres especiais');
  }
  
  try {
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
      throw error;
    }
  } catch (error) {
    console.error('[processPaymentFlow] Erro no processamento do pagamento:', error);
    throw error;
  }
}
