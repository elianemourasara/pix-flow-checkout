import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BillingData, PixPaymentData, Order } from '@/types/checkout';
import { generatePixPayment } from '@/services/asaasService';
import { PixPayment } from '@/components/checkout/payment-methods/PixPayment';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  
  useEffect(() => {
    const billingData = location.state?.billingData as BillingData;
    const orderData = location.state?.order as Order;
    
    if (!billingData || !orderData) {
      toast({
        title: "Erro",
        description: "Informações de pagamento não encontradas. Por favor, volte e tente novamente.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
    
    setOrder(orderData);
    
    const fetchPixPayment = async () => {
      setLoading(true);
      try {
        const data = await generatePixPayment(billingData);
        setPaymentData(data);
      } catch (error) {
        console.error('Erro ao gerar pagamento PIX:', error);
        toast({
          title: "Erro ao gerar pagamento",
          description: "Não foi possível gerar o pagamento PIX. Por favor, tente novamente.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPixPayment();
  }, [location.state, navigate, toast]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-white to-asaas-light/30">
      <div className="w-full max-w-md mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
      
      {loading ? (
        <div className="w-full max-w-md h-64 flex items-center justify-center bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-asaas-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Gerando pagamento PIX...</p>
          </div>
        </div>
      ) : (paymentData && order) ? (
        <PixPayment 
          orderId={order.id || ''} 
          qrCode={paymentData.qrCode}
          qrCodeImage={paymentData.qrCodeImage}
          copyPasteKey={paymentData.copyPasteKey}
          expirationDate={paymentData.expirationDate}
          value={paymentData.value}
          description={paymentData.description}
        />
      ) : (
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg text-center">
          <p className="text-red-500">Erro ao carregar dados do pagamento</p>
          <Button 
            onClick={() => navigate('/')} 
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
