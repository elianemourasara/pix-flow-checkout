
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/checkout';

/**
 * Fetches a product by its slug
 */
export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 is the error code for "no rows returned by a query that expected to return at least one row"
      return null;
    }
    console.error("Error fetching product by slug:", error);
    throw new Error(error.message);
  }

  // Map the database product to our Product type
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    price: Number(data.price),
    isDigital: data.type === 'digital',
    type: (data.type === 'digital' || data.type === 'physical') 
      ? data.type as 'digital' | 'physical' 
      : 'physical',
    imageUrl: data.image_url || undefined,
    status: data.status,
    slug: data.slug
  };
};
