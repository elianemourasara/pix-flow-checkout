
import { supabase } from '../../integrations/supabase/client';

export async function handler(req: Request) {
  console.log('Check payment status API called');
  
  // Define CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Parse the payment ID from URL query parameters
  const url = new URL(req.url);
  const paymentId = url.searchParams.get('paymentId');
  
  console.log(`Checking payment status for ID: ${paymentId}`);
  
  if (!paymentId) {
    return new Response(
      JSON.stringify({
        error: 'Missing payment ID',
        status: 'ERROR'
      }),
      {
        status: 400,
        headers: corsHeaders
      }
    );
  }
  
  try {
    // First check orders table directly with no cache
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('status, updated_at')
      .eq('asaas_payment_id', paymentId)
      .single();
    
    if (!orderError && orderData) {
      console.log(`Found payment status in orders table: ${orderData.status}`);
      
      // Return status from orders table
      return new Response(
        JSON.stringify({
          status: orderData.status,
          paymentId: paymentId,
          updatedAt: orderData.updated_at,
          source: 'orders_table'
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      );
    }
    
    // If not found in orders, try the asaas_payments table
    const { data: paymentData, error: paymentError } = await supabase
      .from('asaas_payments')
      .select('status, updated_at')
      .eq('payment_id', paymentId)
      .single();
    
    if (!paymentError && paymentData) {
      console.log(`Found payment status in asaas_payments table: ${paymentData.status}`);
      
      // Return status from asaas_payments table
      return new Response(
        JSON.stringify({
          status: paymentData.status,
          paymentId: paymentId,
          updatedAt: paymentData.updated_at,
          source: 'asaas_payments_table'
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      );
    }
    
    // If no status found in either table, return default PENDING status
    return new Response(
      JSON.stringify({
        status: 'PENDING',
        paymentId: paymentId,
        updatedAt: new Date().toISOString(),
        source: 'api_default'
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (err) {
    console.error('Error fetching payment status from database:', err);
    
    // Return graceful error response
    return new Response(
      JSON.stringify({
        status: 'PENDING',
        paymentId: paymentId,
        updatedAt: new Date().toISOString(),
        source: 'api_error_handler',
        error: err instanceof Error ? err.message : 'Unknown error'
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  }
}
