
// Update the webhook simulator to support the checkoutSession field
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

// Random ID generator for test payments
const generateTestId = () => `simu_${Math.random().toString(36).substring(2, 15)}`;

// Process a simulated webhook event
const processWebhookEvent = async (
  event: string, 
  paymentId: string, 
  status: string, 
  orderId?: string
) => {
  console.log(`Processing simulated webhook event: ${event}`);
  console.log(`Payment ID: ${paymentId}, Status: ${status}, Order ID: ${orderId || 'not provided'}`);
  
  try {
    // First, try to find the corresponding order
    const { data: orderData, error: orderQueryError } = await supabase
      .from('orders')
      .select('*')
      .eq(paymentId.startsWith('manual_card_payment') || orderId ? 'id' : 'asaas_payment_id', 
           paymentId.startsWith('manual_card_payment') || orderId ? orderId : paymentId)
      .maybeSingle();
      
    if (orderQueryError) {
      console.error('Error querying order:', orderQueryError);
    }
    
    // Log found or not found order
    if (orderData) {
      console.log(`Order found: ${orderData.id}`);
    } else {
      console.log('No corresponding order found');
    }
    
    // Update order status
    let updateResult = null;
    
    if (orderId || paymentId.startsWith('manual_card_payment')) {
      // For manual cards or when orderId is provided directly
      updateResult = await supabase
        .from('orders')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    } else {
      // For regular Asaas payments
      updateResult = await supabase
        .from('orders')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('asaas_payment_id', paymentId);
    }
    
    if (updateResult?.error) {
      console.error('Error updating order status:', updateResult.error);
    } else {
      console.log('Order status updated successfully');
    }
    
    // Record webhook log
    const webhookLog = {
      event_type: event,
      payment_id: paymentId,
      status: status,
      payload: {
        event: event,
        payment: {
          id: paymentId,
          status: status,
          checkoutSession: orderId // Include checkout session ID in the webhook payload
        }
      },
      checkout_session: orderId // Store checkout session ID in the webhook log
    };
    
    const { error: logError } = await supabase
      .from('asaas_webhook_logs')
      .insert(webhookLog);
      
    if (logError) {
      console.error('Error saving webhook log:', logError);
    } else {
      console.log('Webhook log saved successfully');
    }
    
    return {
      success: true,
      message: 'Webhook processed successfully',
      updatedOrderId: orderData ? orderData.id : null,
      paymentId,
      status
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      success: false,
      message: `Error processing webhook: ${error.message || 'Unknown error'}`,
      error
    };
  }
};

export const handler: Handler = async (event) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    const payload = JSON.parse(event.body || '{}');
    console.log('Received webhook simulation payload:', payload);
    
    // Check if this is a manual order-focused webhook (for manual card payments)
    if (payload.orderId) {
      console.log(`Processing for specific order ID: ${payload.orderId}`);
      const result = await processWebhookEvent(
        payload.event || 'PAYMENT_CONFIRMED',
        payload.payment?.id || 'manual_card_payment',
        payload.payment?.status || 'CONFIRMED',
        payload.orderId
      );
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    }
    // Regular Asaas-style webhook
    else if (payload.event && payload.payment && payload.payment.id) {
      console.log('Processing Asaas-style webhook event');
      const result = await processWebhookEvent(
        payload.event,
        payload.payment.id,
        payload.payment.status || 'CONFIRMED',
        payload.payment.checkoutSession // Pass through checkout session if provided
      );
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    } else {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid webhook payload' })
      };
    }
  } catch (error) {
    console.error('Error processing webhook simulation:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Server error', message: error.message })
    };
  }
};
