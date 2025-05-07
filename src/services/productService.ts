
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/checkout';

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching product by slug:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Parse order_bumps from the metadata field if it exists
    const orderBumps = data.metadata?.order_bumps || [];

    const product: Product = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      image_url: data.image_url || '',
      banner_image_url: data.banner_image_url || '',
      price: data.price || 0,
      type: data.type || 'digital',
      isDigital: data.type === 'digital',
      use_global_colors: data.use_global_colors,
      button_color: data.button_color,
      heading_color: data.heading_color,
      banner_color: data.banner_color,
      has_whatsapp_support: data.has_whatsapp_support,
      whatsapp_number: data.whatsapp_number,
      status: data.status,
      order_bumps: orderBumps
    };

    return product;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
};

export const updateProduct = async (id: string, productData: any): Promise<Product | null> => {
  try {
    // Extract order bumps to store in metadata
    const orderBumps = productData.order_bumps || [];
    
    // Create metadata object with order_bumps
    const metadata = {
      order_bumps: orderBumps
    };
    
    // Remove order_bumps from the direct update object
    const { order_bumps, ...productDataWithoutOrderBumps } = productData;
    
    // Add metadata field to the update
    const updateData = {
      ...productDataWithoutOrderBumps,
      metadata
    };
    
    // Log what we're sending to the database
    console.log("Updating product with data:", updateData);
    
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // When returning, reattach the order_bumps from metadata
    const returnProduct = {
      ...data,
      order_bumps: data.metadata?.order_bumps || []
    };
    
    return returnProduct;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Parse order_bumps from metadata if exists
    const orderBumps = data.metadata?.order_bumps || [];

    const product: Product = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      image_url: data.image_url || '',
      banner_image_url: data.banner_image_url || '',
      price: data.price || 0,
      type: data.type || 'digital',
      isDigital: data.type === 'digital',
      use_global_colors: data.use_global_colors,
      button_color: data.button_color,
      heading_color: data.heading_color,
      banner_color: data.banner_color,
      has_whatsapp_support: data.has_whatsapp_support,
      whatsapp_number: data.whatsapp_number,
      status: data.status,
      order_bumps: orderBumps
    };

    return product;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
};

// Integrate with CheckoutContent component
export const getOrderBumpsForProduct = async (productId: string): Promise<any[]> => {
  try {
    const product = await getProductById(productId);
    
    if (!product || !product.order_bumps || product.order_bumps.length === 0) {
      return [];
    }
    
    // Filter only active order bumps
    return product.order_bumps.filter(bump => bump.active !== false);
  } catch (error) {
    console.error('Error getting order bumps for product:', error);
    return [];
  }
};
