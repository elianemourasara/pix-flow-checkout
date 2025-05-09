
import { SupabasePaymentData } from './types';

export const savePaymentData = async (supabase: any, data: SupabasePaymentData) => {
  // Format dates correctly
  let paymentData = { ...data };
  
  // Handle date formatting if needed
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  if (paymentData.expiration_date && !isoPattern.test(paymentData.expiration_date)) {
    paymentData.expiration_date = new Date(paymentData.expiration_date).toISOString();
  }
  
  // Check if checkout_session is included
  if (paymentData.checkout_session) {
    console.log(`[savePaymentData] Including checkout session: ${paymentData.checkout_session}`);
  }

  console.log(`[savePaymentData] Saving payment data for order ID: ${paymentData.order_id}`);
  console.log(`[savePaymentData] Payment ID: ${paymentData.payment_id}`);
  
  try {
    console.log("[savePaymentData] Inserting payment record to asaas_payments...");
    
    const { data: savedPayment, error } = await supabase
      .from('asaas_payments')
      .insert(paymentData)
      .select()
      .single();
      
    if (error) {
      console.error('[savePaymentData] Error saving payment data:', error);
      throw error;
    }
    
    console.log('[savePaymentData] Payment data saved successfully');
    return savedPayment;
  } catch (error) {
    console.error('[savePaymentData] Exception during payment save:', error);
    throw error;
  }
};

export const updateOrderAsaasPaymentId = async (
  supabase: any, 
  orderId: string, 
  paymentId: string,
  checkoutSession?: string // Add checkpoint session parameter
) => {
  try {
    console.log(`[updateOrderAsaasPaymentId] Updating order ${orderId} with payment ID ${paymentId}`);

    const updateData: any = {
      asaas_payment_id: paymentId,
      updated_at: new Date().toISOString()
    };
    
    // Add checkout session if provided
    if (checkoutSession) {
      updateData.asaas_checkout_session = checkoutSession;
      console.log(`[updateOrderAsaasPaymentId] Including checkout session: ${checkoutSession}`);
    }
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);
      
    if (error) {
      console.error('[updateOrderAsaasPaymentId] Error updating order:', error);
      throw error;
    }
    
    console.log('[updateOrderAsaasPaymentId] Order updated successfully');
    return true;
  } catch (error) {
    console.error('[updateOrderAsaasPaymentId] Exception during order update:', error);
    throw error;
  }
};

// Update the order's payment ID and record status update
export const updateOrderStatus = async (
  supabase: any, 
  orderId: string, 
  status: string,
  checkoutSession?: string // Add checkout session parameter
) => {
  try {
    console.log(`[updateOrderStatus] Updating order ${orderId} to status ${status}`);

    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };
    
    // Add checkout session if provided
    if (checkoutSession) {
      updateData.asaas_checkout_session = checkoutSession;
      console.log(`[updateOrderStatus] Including checkout session: ${checkoutSession}`);
    }
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);
      
    if (error) {
      console.error('[updateOrderStatus] Error updating order status:', error);
      throw error;
    }
    
    console.log('[updateOrderStatus] Order status updated successfully');
    return true;
  } catch (error) {
    console.error('[updateOrderStatus] Exception during status update:', error);
    throw error;
  }
};
