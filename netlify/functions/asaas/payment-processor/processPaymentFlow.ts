import { AsaasCustomerRequest, SupabasePaymentData } from '../types';
import { createAsaasCustomer, createAsaasPayment, getAsaasPixQrCode } from '../asaas-api';
import { savePaymentData, updateOrderAsaasPaymentId } from '../supabase-operations';
import * as https from 'https';

// Import the PushinPay service
import { criarCobrancaViaPushinPay } from '../pushinpay-api';

/**
 * Função para processar o pagamento com o provedor configurado
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
  
  // Check which payment provider to use
  const paymentProvider = process.env.PAYMENT_PROVIDER || 'asaas';
  console.log(`[processPaymentFlow] Usando provedor de pagamento: ${paymentProvider}`);
  
  // Get UTM data if available
  const utmData = requestData.utms || {};
  
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
    
    // Usar PushinPay caso configurado
    if (paymentProvider === 'pushinpay') {
      console.log('[processPaymentFlow] Processando pagamento via PushinPay');
      
      // Create PushinPay payment
      const pushinPayResult = await criarCobrancaViaPushinPay({
        amount: requestData.value,
        description: requestData.description || `Pedido #${requestData.orderId}`,
        externalReference: requestData.orderId,
        utms: utmData
      });
      
      console.log('[processPaymentFlow] Resultado PushinPay:', pushinPayResult);
      
      // Save payment data to Supabase
      const paymentData = {
        order_id: requestData.orderId,
        payment_id: `pushinpay_${pushinPayResult.endToEndId || Date.now()}`,
        status: pushinPayResult.status || 'PENDING',
        amount: requestData.value,
        qr_code: '',
        qr_code_image: pushinPayResult.qr_code_url,
        copy_paste_key: '',
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h expiration
      };
      
      const saveResult = await savePaymentData(supabase, paymentData);
      console.log('[processPaymentFlow] Dados salvos no Supabase:', saveResult);
      
      // Update order with PushinPay data
      await supabase
        .from('orders')
        .update({
          external_reference: requestData.orderId,
          gateway: 'pushinpay',
          payment_url: pushinPayResult.payment_url,
          qr_code_url: pushinPayResult.qr_code_url
        })
        .eq('id', requestData.orderId);
      
      console.log('==================== FIM DO PROCESSAMENTO DE PAGAMENTO (SUCESSO) ====================');
      
      // Return formatted response data
      return {
        payment: { id: `pushinpay_${pushinPayResult.endToEndId || Date.now()}` },
        pixQrCode: {
          encodedImage: pushinPayResult.qr_code_url,
          payload: '',
          success: true
        },
        paymentData: saveResult,
        qrCodeImage: pushinPayResult.qr_code_url,
        qrCode: '',
        copyPasteKey: '',
        expirationDate: paymentData.expiration_date,
        paymentId: `pushinpay_${pushinPayResult.endToEndId || Date.now()}`
      };
    } else {
      // Continue with existing Asaas flow
      console.log(`[processPaymentFlow] Chamando API Asaas (${apiUrl}) para criar cliente...`);
    
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
    }
  } catch (error) {
    console.error('[processPaymentFlow] Erro no processamento do pagamento:', error);
    console.log('==================== FIM DO PROCESSAMENTO DE PAGAMENTO (ERRO) ====================');
    throw error;
  }
}
