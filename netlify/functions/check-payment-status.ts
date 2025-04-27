
import { Handler, HandlerEvent } from '@netlify/functions';
import { supabase } from './asaas/supabase-client';
import { getAsaasApiKey, getAsaasApiBaseUrl } from './asaas/get-asaas-api-key';

export const handler: Handler = async (event: HandlerEvent) => {
  // Headers padrão para CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };

  // Responder à solicitação OPTIONS para CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Verificar se o método é GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido. Use GET.' }),
    };
  }

  // Obter o ID do pagamento da query string
  const paymentId = event.queryStringParameters?.paymentId;
  
  console.log(`Verificando status para paymentId: ${paymentId}`);
  
  if (!paymentId) {
    console.log('ID do pagamento não fornecido na query.');
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'ID do pagamento não fornecido.', status: 'ERROR' }),
    };
  }

  try {
    // Primeiro, verificar diretamente na tabela orders
    console.log('Verificando status na tabela orders...');
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('status, updated_at')
      .eq('asaas_payment_id', paymentId)
      .single();
    
    if (!orderError && orderData) {
      console.log(`Status encontrado na tabela orders: ${orderData.status}`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: orderData.status,
          paymentId,
          updatedAt: orderData.updated_at,
          source: 'orders_table'
        }),
      };
    } else {
      console.log('Nenhum resultado encontrado na tabela orders, verificando tabela asaas_payments...');
    }
    
    // Não encontrado em orders, verificar em asaas_payments
    const { data: paymentData, error: paymentError } = await supabase
      .from('asaas_payments')
      .select('status, updated_at')
      .eq('payment_id', paymentId)
      .single();
    
    if (!paymentError && paymentData) {
      console.log(`Status encontrado na tabela asaas_payments: ${paymentData.status}`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: paymentData.status,
          paymentId,
          updatedAt: paymentData.updated_at,
          source: 'asaas_payments_table'
        }),
      };
    } else {
      console.log('Pagamento não encontrado em nenhuma tabela local.');
    }

    // Se não encontrou nas tabelas locais, consultar diretamente na API do Asaas
    try {
      console.log('Tentando obter status diretamente da API do Asaas...');
      
      // Obter a configuração do Asaas
      const { data: asaasConfig, error: configError } = await supabase
        .from('asaas_config')
        .select('*')
        .limit(1)
        .single();
        
      if (configError) {
        console.error('Erro ao buscar configuração do Asaas:', configError);
        throw new Error('Erro ao buscar configuração do gateway de pagamento');
      }
      
      // Determinar qual chave API usar
      const usesSandbox = asaasConfig.sandbox === true;
      const apiKey = await getAsaasApiKey(usesSandbox);
      const apiBaseUrl = getAsaasApiBaseUrl(usesSandbox);
      
      console.log(`Usando ambiente: ${usesSandbox ? 'Sandbox' : 'Produção'}`);
      
      if (!apiKey) {
        console.error(`Chave de API ${usesSandbox ? 'sandbox' : 'produção'} não configurada`);
        throw new Error(`Chave de API ${usesSandbox ? 'sandbox' : 'produção'} não configurada`);
      }
      
      // Consultar o status na API do Asaas
      const response = await fetch(`${apiBaseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na API do Asaas: ${response.status} - ${errorText}`);
        
        // Mesmo com erro, retornar PENDING para não quebrar o fluxo do cliente
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: 'PENDING',
            paymentId,
            updatedAt: new Date().toISOString(),
            source: 'fallback_pending',
            apiError: `${response.status}: ${errorText.substring(0, 100)}`
          }),
        };
      }
      
      const asaasData = await response.json();
      const asaasStatus = asaasData.status;
      
      console.log(`Status da API do Asaas: ${asaasStatus}`);
      
      // Atualizar o status nas tabelas locais
      try {
        await supabase
          .from('asaas_payments')
          .upsert({
            payment_id: paymentId,
            status: asaasStatus,
            updated_at: new Date().toISOString()
          });
          
        // Tentar atualizar orders se houver vínculo
        const { data: orderInfo } = await supabase
          .from('orders')
          .select('id')
          .eq('asaas_payment_id', paymentId)
          .single();
          
        if (orderInfo?.id) {
          await supabase
            .from('orders')
            .update({ 
              status: asaasStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderInfo.id);
        }
      } catch (updateError) {
        console.error('Erro ao atualizar status local:', updateError);
        // Continuar mesmo com erro de atualização
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: asaasStatus,
          paymentId,
          updatedAt: asaasData.dateCreated || new Date().toISOString(),
          source: 'asaas_api'
        }),
      };
      
    } catch (asaasError) {
      console.error('Erro ao consultar API Asaas:', asaasError);
      
      // Retornar PENDING em caso de erro na API para não quebrar o fluxo
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'PENDING',
          paymentId,
          updatedAt: new Date().toISOString(),
          source: 'error_fallback',
          error: asaasError instanceof Error ? asaasError.message : 'Erro ao consultar API externa'
        }),
      };
    }
    
    // Se chegou aqui, não encontrou em nenhum lugar, retornar PENDING
    console.log('Nenhum dado de pagamento encontrado, retornando status padrão PENDING');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'PENDING',
        paymentId,
        updatedAt: new Date().toISOString(),
        source: 'default_pending'
      }),
    };
  } catch (error) {
    console.error('Erro geral na função check-payment-status:', error);
    
    // Mesmo com erro interno, retornar 200 com status PENDING para não quebrar o fluxo do cliente
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'PENDING',
        paymentId,
        updatedAt: new Date().toISOString(),
        source: 'error_handler',
        errorMessage: error instanceof Error ? error.message : 'Erro interno no servidor'
      }),
    };
  }
};
