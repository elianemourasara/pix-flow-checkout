
import { AsaasCustomerRequest, SupabasePaymentData } from '../types';
import { createAsaasCustomer, createAsaasPayment, getAsaasPixQrCode } from '../asaas-api';
import { savePaymentData, updateOrderAsaasPaymentId } from '../supabase-operations';
import * as https from 'https';

/**
 * Função para processar o pagamento com a chave API fornecida
 */
export async function processPaymentFlow(
  requestData: AsaasCustomerRequest,
  apiKey: string,
  supabase: any,
  apiUrl: string
) {
  console.log('==================== INÍCIO DO PROCESSAMENTO DE PAGAMENTO ====================');
  console.log(`[processPaymentFlow] Iniciando fluxo de pagamento com API URL: ${apiUrl}`);
  console.log(`[processPaymentFlow] Valor do pagamento: ${requestData.value}`);
  console.log(`[processPaymentFlow] Comprimento da chave API: ${apiKey.length} caracteres`);
  console.log(`[processPaymentFlow] Primeiros caracteres da chave API: ${apiKey.substring(0, 8)}...`);
  console.log(`[processPaymentFlow] Últimos caracteres da chave API: ...${apiKey.substring(apiKey.length - 4)}`);
  
  // Log detalhado da chave API (formato)
  console.log(`[ASAAS] Análise da chave API:`);
  console.log(`[ASAAS] - Comprimento total: ${apiKey.length} caracteres`);
  console.log(`[ASAAS] - Começa com $: ${apiKey.startsWith('$')}`);
  console.log(`[ASAAS] - Começa com aact_: ${apiKey.startsWith('aact_')}`);
  console.log(`[ASAAS] - Começa com $aact_: ${apiKey.startsWith('$aact_')}`);
  
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
    
    // Testando conexão com a API antes de prosseguir
    try {
      console.log('[ASAAS] Testando conexão com a API antes de prosseguir...');
      const fetch = require('node-fetch');
      const testResponse = await fetch(`${apiUrl}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`[ASAAS] Teste de conexão - Status: ${testResponse.status}`);
      const testBody = await testResponse.text();
      console.log(`[ASAAS] Teste de conexão - Corpo: ${testBody}`);
      
      // IMPORTANTE: Não bloquear o fluxo mesmo se o teste falhar
      console.log('[ASAAS] Continuando processamento independente do resultado do teste');
    } catch (connError) {
      console.error('[ASAAS] Erro ao testar conexão:', connError);
      console.log('[ASAAS] Continuando processamento mesmo com erro no teste');
    }
    
    try {
      // 1. Create customer in Asaas
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
        expirationDate: pixQrCode.expirationDate,
        paymentId: payment.id
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
