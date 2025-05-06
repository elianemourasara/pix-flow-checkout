
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Plus, Trash, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ProductFormValues } from '../../ProductSchema';

interface OrderBumpsProps {
  form: UseFormReturn<ProductFormValues>;
}

const OrderBumpsSection: React.FC<OrderBumpsProps> = ({ form }) => {
  const orderBumps = form.watch('order_bumps') || [];
  
  const handleAddOrderBump = () => {
    const currentOrderBumps = form.getValues('order_bumps') || [];
    
    form.setValue('order_bumps', [
      ...currentOrderBumps,
      {
        id: `bump-${Date.now()}`,
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        active: true
      }
    ], { shouldDirty: true, shouldValidate: true });
  };
  
  const handleRemoveOrderBump = (index: number) => {
    const currentOrderBumps = [...form.getValues('order_bumps') || []];
    currentOrderBumps.splice(index, 1);
    form.setValue('order_bumps', currentOrderBumps, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Order Bumps</CardTitle>
        <p className="text-sm text-gray-500">
          Adicione ofertas complementares que aparecem no checkout.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {orderBumps.map((_, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Order Bump #{index + 1}</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  type="button"
                  onClick={() => handleRemoveOrderBump(index)}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              
              <FormField
                control={form.control}
                name={`order_bumps.${index}.active`}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id={`bump-active-${index}`}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor={`bump-active-${index}`}>Ativo</Label>
                  </div>
                )}
              />
              
              <FormField
                control={form.control}
                name={`order_bumps.${index}.name`}
                rules={{ required: "Nome é obrigatório" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Garantia Estendida" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`order_bumps.${index}.description`}
                rules={{ required: "Descrição é obrigatória" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição do produto adicional" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`order_bumps.${index}.price`}
                rules={{ 
                  required: "Preço é obrigatório",
                  min: { value: 0, message: "Preço não pode ser negativo" }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`order_bumps.${index}.imageUrl`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={handleAddOrderBump}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Order Bump
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderBumpsSection;
