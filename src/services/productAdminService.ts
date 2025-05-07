
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/checkout';

export const createProduct = async (productData: any): Promise<any> => {
  try {
    // Extract order bumps to store in metadata
    const orderBumps = productData.order_bumps || [];
    
    // Create metadata object with order_bumps
    const metadata = {
      order_bumps: orderBumps
    };
    
    // Remove order_bumps from the direct data object
    const { order_bumps, ...productDataWithoutOrderBumps } = productData;
    
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productDataWithoutOrderBumps,
        metadata
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Reattach order_bumps to the returned data for consistent interface
    const returnData = {
      ...data,
      order_bumps: data.metadata?.order_bumps || []
    };
    
    return returnData;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};

export const updateProduct = async (id: string, productData: any): Promise<any> => {
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

export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
};

// Add the missing getAllProducts export as fetchProducts
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      isDigital: product.type === 'digital',
      type: product.type,
      status: product.status,
      slug: product.slug,
      image_url: product.image_url || '',
      banner_image_url: product.banner_image_url || '',
      has_whatsapp_support: product.has_whatsapp_support,
      whatsapp_number: product.whatsapp_number,
      use_global_colors: product.use_global_colors,
      button_color: product.button_color,
      heading_color: product.heading_color,
      banner_color: product.banner_color
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Adding the missing handleDeleteProduct function
export const handleDeleteProduct = async (
  product: Product, 
  onSuccess?: () => void
): Promise<void> => {
  try {
    if (!product || !product.id) {
      console.error('Invalid product data');
      return;
    }

    const deleted = await deleteProduct(product.id);
    
    if (deleted && onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error('Error handling product deletion:', error);
  }
};

export const getAllProducts = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      isDigital: product.type === 'digital',
      type: product.type,
      status: product.status,
      slug: product.slug,
      image_url: product.image_url || '',
      banner_image_url: product.banner_image_url || '',
      has_whatsapp_support: product.has_whatsapp_support,
      whatsapp_number: product.whatsapp_number,
      use_global_colors: product.use_global_colors,
      button_color: product.button_color,
      heading_color: product.heading_color,
      banner_color: product.banner_color,
      order_bumps: product.metadata?.order_bumps || []
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
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
      order_bumps: data.metadata?.order_bumps || []
    };

    return product;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
};
