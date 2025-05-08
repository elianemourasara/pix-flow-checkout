
import { supabase } from '@/integrations/supabase/client';
import { generatePassword, createUser, grantCourseAccess } from '@/utils/authUtils';
import { sendLoginCredentialsEmail } from '@/services/emailService';

export async function handler(req: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('PushinPay webhook received');
    const payload = await req.json();
    console.log('Webhook payload:', payload);

    // Validate webhook payload
    if (!payload || !payload.external_reference) {
      return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const { external_reference: orderId, status, end_to_end_id: endToEndId } = payload;
    
    // Log webhook data
    await supabase.from('asaas_webhook_logs').insert([{
      event_type: 'pushinpay_webhook',
      payment_id: `pushinpay_${orderId}`,
      status,
      payload
    }]);

    // Only process if status is 'PAID'
    if (status === 'PAID') {
      console.log('Processing paid status for order:', orderId);

      // Update order status
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'CONFIRMED',
          gateway: 'pushinpay',
          end_to_end_id: endToEndId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select('customer_name, customer_email, product_id')
        .single();

      if (orderError) {
        console.error('Error updating order:', orderError);
        return new Response(JSON.stringify({ error: 'Error updating order' }), {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }

      console.log('Order updated successfully:', orderData);

      // Create user and grant access
      if (orderData) {
        try {
          // Generate password
          const password = generatePassword(12);
          
          // Create user
          const userData = await createUser(
            orderData.customer_email,
            password,
            orderData.customer_name
          );
          
          console.log('User created:', userData);
          
          // Grant course access
          if (userData && orderData.product_id) {
            await grantCourseAccess(userData.id, orderData.product_id);
            console.log('Course access granted');
            
            // Send login credentials email
            await sendLoginCredentialsEmail(
              orderData.customer_email,
              password,
              orderData.customer_name
            );
            
            console.log('Login credentials email sent');
          }
        } catch (error) {
          console.error('Error in user creation flow:', error);
          // Continue processing the webhook even if user creation fails
        }
      }

      return new Response(JSON.stringify({ success: true, message: 'Payment processed successfully' }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // For other statuses, just acknowledge receipt
    return new Response(JSON.stringify({ success: true, message: 'Webhook received', status }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}
