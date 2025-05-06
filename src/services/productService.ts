
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

    // Parse order_bumps from JSONB if exists
    const orderBumps = data.order_bumps ? data.order_bumps : [];

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
    const { data, error } = await supabase
      .from('products')
      .update({
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price) || 0,
        type: productData.type || 'digital',
        status: productData.status !== false,
        slug: productData.slug,
        image_url: productData.image_url || '',
        banner_image_url: productData.banner_image_url || '',
        has_whatsapp_support: productData.has_whatsapp_support,
        whatsapp_number: productData.whatsapp_number,
        use_global_colors: productData.use_global_colors,
        button_color: productData.button_color,
        heading_color: productData.heading_color,
        banner_color: productData.banner_color,
        order_bumps: productData.order_bumps || []
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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

    // Parse order_bumps from JSONB if exists
    const orderBumps = data.order_bumps ? data.order_bumps : [];

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
