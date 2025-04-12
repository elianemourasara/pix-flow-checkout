
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PixPaymentStatus } from './PixPaymentStatus';
import { PixQRCodeDisplay } from './PixQRCodeDisplay';
import { PixExpirationTimer } from './PixExpirationTimer';
import { PixCopyPasteField } from './PixCopyPasteField';
import { PixStatusChecker } from './PixStatusChecker';
import { PixPaymentDetails } from './PixPaymentDetails';
import { PaymentStatus } from '@/types/checkout';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

interface PixPaymentContainerProps {
  orderId: string;
  paymentId: string;
  qrCode: string;
  qrCodeImage: string;
  copyPasteKey: string;
  expirationDate: string;
  value: number;
  description: string;
  status: PaymentStatus;
  isCheckingStatus: boolean;
  timeLeft: string;
  isExpired: boolean;
  onCheckStatus: () => void;
}

export const PixPaymentContainer: React.FC<PixPaymentContainerProps> = ({
  orderId,
  paymentId,
  qrCode,
  qrCodeImage,
  copyPasteKey,
  expirationDate,
  value,
  description,
  status,
  isCheckingStatus,
  timeLeft,
  isExpired,
  onCheckStatus
}) => {
  const { toast } = useToast();
  const isPending = status === "PENDING";
  const showQRCode = isPending && !isExpired;
  
  // Log importantes ao montar o componente para diagnóstico
  useEffect(() => {
    console.log("PixPaymentContainer - Status do pagamento:", status);
    console.log("PixPaymentContainer - ID do pagamento:", paymentId);
    console.log("PixPaymentContainer - ID do pedido:", orderId);
    console.log("PixPaymentContainer - Exibir QR code:", showQRCode);
    
    // Verificar se temos um QR code válido
    const hasValidQRCodeImage = qrCodeImage && qrCodeImage.length > 100;
    console.log("PixPaymentContainer - QR Code Image disponível:", hasValidQRCodeImage);
    if (!hasValidQRCodeImage) {
      console.warn("QR Code Image não disponível ou inválido:", qrCodeImage ? qrCodeImage.substring(0, 30) + "..." : "Não fornecido");
      
      // Notificar o usuário sobre o problema do QR code
      if (!qrCodeImage && isPending) {
        toast({
          title: "Problema com QR Code",
          description: "Use o código de cópia e cola abaixo para realizar o pagamento.",
          variant: "default", 
        });
      }
    }
  }, [orderId, paymentId, qrCodeImage, status, showQRCode, toast, isPending]);

  return (
    <Card className="max-w-md mx-auto shadow-xl border border-gray-100 rounded-xl overflow-hidden animate-fade-in pix-container bg-gradient-to-b from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-asaas-primary/90 to-asaas-secondary/90 text-white">
        <CardTitle className="text-2xl flex items-center">
          <Sparkles className="mr-2 h-5 w-5" />
          Pagamento PIX
        </CardTitle>
        <CardDescription className="text-white/90">
          {showQRCode ? 'Escaneie o QR Code ou copie o código para pagar' : 'Detalhes do pagamento'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* Status de pagamento */}
        <PixPaymentStatus status={status} />
        
        {/* Exibe o QR Code apenas se o pagamento estiver pendente e não expirado */}
        {showQRCode && (
          <div className="space-y-6 animate-scale-in">
            <PixQRCodeDisplay qrCodeImage={qrCodeImage} />
            
            <PixExpirationTimer timeLeft={timeLeft} isExpired={isExpired} />
            
            <PixCopyPasteField copyPasteKey={copyPasteKey} />
            
            <PixStatusChecker 
              isCheckingStatus={isCheckingStatus} 
              onCheckStatus={onCheckStatus} 
            />
          </div>
        )}
        
        {/* Se estiver expirado mas ainda PENDING, mostre opção de verificar status */}
        {isExpired && isPending && (
          <PixStatusChecker 
            isCheckingStatus={isCheckingStatus} 
            onCheckStatus={onCheckStatus} 
          />
        )}
      </CardContent>
      
      <PixPaymentDetails description={description} value={value} />
    </Card>
  );
};
