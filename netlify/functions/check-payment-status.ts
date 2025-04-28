
import { Handler } from '@netlify/functions';
import { supabase } from './asaas/supabase-client';
import { getAsaasApiKey, getAsaasApiBaseUrl } from './asaas/get-asaas-api-key';

// Define CORS headers para permitir chamadas do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};

const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders
    };
  }

  // Obter o ID do pagamento da query string
  const paymentId = event.queryStringParameters?.paymentId;
  
  console.log(`Verificando status do pagamento: ${paymentId}`);
  
  if (!paymentId) {
    console.error('ID de pagamento não fornecido');
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'ID de pagamento não fornecido', status: 'PENDING' })
    };
  }

  try {
    // Primeiro, verificar se o pagamento já existe no banco de dados
    console.log('Verificando status do pagamento no banco de dados...');
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('status, updated_at')
      .eq('asaas_payment_id', paymentId)
      .single();
    
    if (!orderError && orderData) {
      console.log(`Status do pagamento encontrado na tabela orders: ${orderData.status}`);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: orderData.status,
          updatedAt: orderData.updated_at,
          source: 'database'
        })
      };
    }
    
    // Se não encontrou nos pedidos, verificar na tabela de pagamentos
    const { data: asaasPayment, error: asaasPaymentError } = await supabase
      .from('asaas_payments')
      .select('status, updated_at')
      .eq('payment_id', paymentId)
      .single();
    
    if (!asaasPaymentError && asaasPayment) {
      console.log(`Status do pagamento encontrado na tabela asaas_payments: ${asaasPayment.status}`);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: asaasPayment.status,
          updatedAt: asaasPayment.updated_at,
          source: 'database'
        })
      };
    }
    
    // Se não encontrou no banco, consultar diretamente na API do Asaas
    console.log('Pagamento não encontrado no banco. Consultando API do Asaas...');
    
    // Determine environment based on USE_ASAAS_PRODUCTION
    const useProduction = process.env.USE_ASAAS_PRODUCTION === 'true';
    const isSandbox = !useProduction;
    
    // Obter a URL da API com base no ambiente
    const apiBaseUrl = getAsaasApiBaseUrl(isSandbox);
    console.log(`API Base URL: ${apiBaseUrl}`);
    
    // Obter a chave API
    const apiKey = await getAsaasApiKey(isSandbox);
    
    if (!apiKey) {
      console.error(`Nenhuma chave ${isSandbox ? 'sandbox' : 'produção'} encontrada`);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'API key not configured', 
          status: 'PENDING' 
        })
      };
    }
    
    // Consultar status do pagamento na API do Asaas
    const paymentEndpoint = `${apiBaseUrl}/payments/${paymentId}`;
    console.log(`Consultando status na API: ${paymentEndpoint}`);
    
    const response = await fetch(paymentEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro ao consultar status na API: ${response.status} - ${errorText}`);
      
      return {
        statusCode: 200, // Retorna 200 mesmo em caso de erro para não quebrar o frontend
        headers: corsHeaders,
        body: JSON.stringify({ 
          status: 'PENDING', 
          error: `Erro ao consultar API: ${response.status}`,
          details: errorText.substring(0, 200)
        })
      };
    }
    
    const paymentData = await response.json();
    console.log(`Status obtido da API: ${paymentData.status}`);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: paymentData.status,
        updatedAt: new Date().toISOString(),
        source: 'api'
      })
    };
    
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    
    return {
      statusCode: 200, // Retorna 200 mesmo em caso de erro para não quebrar o frontend
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'PENDING',
        error: error.message,
        source: 'error'
      })
    };
  }
};

export { handler };
