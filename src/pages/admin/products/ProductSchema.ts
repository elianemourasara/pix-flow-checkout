
import { z } from 'zod';
import { OrderBump } from '@/types/checkout';

// Schema de validação para OrderBump
const orderBumpSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.number().min(0, "Preço não pode ser negativo"),
  imageUrl: z.string().optional(),
  active: z.boolean().default(true)
});

// Schema de validação para produto
export const productSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  slug: z.string()
    .min(1, "Slug é obrigatório")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  description: z.string().optional(),
  price: z.number().min(0, "Preço não pode ser negativo"),
  image_url: z.string().optional(),
  banner_image_url: z.string().optional(),
  type: z.enum(['digital', 'physical']),
  use_global_colors: z.boolean().default(true),
  button_color: z.string().optional(),
  heading_color: z.string().optional(),
  banner_color: z.string().optional(),
  status: z.boolean().default(true),
  has_whatsapp_support: z.boolean().default(false),
  whatsapp_number: z.string().optional(),
  order_bumps: z.array(orderBumpSchema).optional()
});

// Tipo inferido do schema
export type ProductFormValues = z.infer<typeof productSchema>;

// Função para gerar slug a partir do nome
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
