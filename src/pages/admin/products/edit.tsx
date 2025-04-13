import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { ProductForm } from './ProductForm';
import { productSchema, ProductFormValues, generateSlug } from './ProductSchema';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Define a type for the product from the database
type ProductData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  type: 'digital' | 'physical';
  status: boolean;
  slug: string;
  has_whatsapp_support?: boolean;
  whatsapp_number?: string | null;
}

const EditProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      image_url: '',
      type: 'physical',
      status: true,
      has_whatsapp_support: false,
      whatsapp_number: '',
    },
  });

  const { isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('ID do produto não fornecido');

      console.log(`[EditProductPage] Fetching product with ID: ${id}`);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[EditProductPage] Erro ao buscar produto:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Produto não encontrado');
      }

      // Cast data to ProductData type
      const productData = data as ProductData;
      
      console.log('[EditProductPage] Product data from DB:', productData);
      console.log('[EditProductPage] WhatsApp support details:', {
        has_whatsapp_support: productData.has_whatsapp_support,
        whatsapp_number: productData.whatsapp_number,
        supportType: typeof productData.has_whatsapp_support,
        numberType: typeof productData.whatsapp_number
      });

      // Set form values
      form.reset({
        name: productData.name,
        description: productData.description || '',
        price: productData.price,
        image_url: productData.image_url || '',
        type: productData.type,
        status: productData.status,
        slug: productData.slug,
        has_whatsapp_support: productData.has_whatsapp_support || false,
        whatsapp_number: productData.whatsapp_number || '',
      });

      return productData;
    },
    retry: false,
  });

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (!id) return;

      // Generate slug from name if not provided
      const slug = data.slug || generateSlug(data.name);
      
      console.log('[EditProductPage] Submitting product update:', { 
        ...data, 
        slug,
        has_whatsapp_support: data.has_whatsapp_support,
        whatsapp_number: data.has_whatsapp_support ? data.whatsapp_number : null,
      });
      
      const { data: updatedData, error } = await supabase
        .from('products')
        .update({
          name: data.name,
          description: data.description || null,
          price: data.price,
          image_url: data.image_url || null,
          type: data.type,
          status: data.status,
          slug: slug,
          has_whatsapp_support: data.has_whatsapp_support,
          whatsapp_number: data.has_whatsapp_support ? data.whatsapp_number : null,
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('[EditProductPage] Erro de atualização detalhado:', error);
        if (error.code === '23505') {
          toast({
            title: 'Erro ao atualizar produto',
            description: 'Já existe um produto com este nome ou slug.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      console.log('[EditProductPage] Product updated successfully:', updatedData);
      toast({
        title: 'Produto atualizado',
        description: 'O produto foi atualizado com sucesso!',
      });
      
      navigate('/admin/products');
    } catch (error) {
      console.error('[EditProductPage] Erro ao atualizar produto:', error);
      toast({
        title: 'Erro ao atualizar produto',
        description: 'Ocorreu um erro ao tentar atualizar o produto. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-red-600 font-medium">Erro ao carregar produto</h2>
          <p className="text-red-500">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Editar Produto</h1>
      <ProductForm 
        form={form} 
        onSubmit={onSubmit} 
        isSubmitting={form.formState.isSubmitting}
        isEditing={true}
      />
    </div>
  );
};

export default EditProductPage;
