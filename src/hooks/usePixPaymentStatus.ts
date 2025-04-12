
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PaymentStatus } from '@/types/checkout';
import { usePaymentPolling } from '@/components/checkout/payment-methods/qr-code/usePaymentPolling';

interface UsePixPaymentStatusProps {
  paymentId: string;
  orderId: string;
  expirationDate: string;
}

interface UsePixPaymentStatusResult {
  status: PaymentStatus;
  timeLeft: string;
  isCheckingStatus: boolean;
  forceCheckStatus: () => void;
  isExpired: boolean;
}

// Function to calculate time left until expiration
const calculateTimeLeft = (expirationDate: string): { timeLeftString: string; isExpired: boolean } => {
  try {
    // Parse the expiration date string safely
    const expirationTime = new Date(expirationDate);
    
    // Check if the date is valid
    if (isNaN(expirationTime.getTime())) {
      console.error('Invalid expiration date:', expirationDate);
      return { timeLeftString: '00:00:00', isExpired: true };
    }
    
    const now = new Date();
    const difference = expirationTime.getTime() - now.getTime();
    
    if (difference <= 0) {
      return { timeLeftString: '00:00:00', isExpired: true };
    }
    
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((difference % (1000 * 60)) / 1000).toString().padStart(2, '0');
    
    return { 
      timeLeftString: `${hours}:${minutes}:${seconds}`, 
      isExpired: false 
    };
  } catch (error) {
    console.error('Error calculating time left:', error);
    return { timeLeftString: '00:00:00', isExpired: true };
  }
};

// Separate function to handle payment confirmation redirection
const handlePaymentConfirmation = (orderId: string, navigate: ReturnType<typeof useNavigate>, toast: ReturnType<typeof useToast>, setRedirecting: (val: boolean) => void) => {
  setRedirecting(true);
  
  // Show confirmation toast
  toast({
    title: "Pagamento confirmado!",
    description: "Seu pagamento foi processado com sucesso.",
  });
  
  // Open new page with confirmation and then redirect
  console.log("Pagamento confirmado, preparando redirecionamento para página de sucesso");
  
  // Try to open a new window with confirmation message
  const successWindow = window.open("", "_blank");
  if (successWindow) {
    successWindow.document.write(`
      <html>
        <head>
          <title>Pagamento Aprovado</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              color: #333;
            }
            .message {
              text-align: center;
              padding: 40px;
              border-radius: 16px;
              background-color: white;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              border-top: 5px solid #10b981;
              max-width: 90%;
              width: 500px;
              animation: fadeIn 0.6s ease-out;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            h1 { 
              color: #10b981; 
              font-size: 2.2rem;
              margin-bottom: 0.5rem;
            }
            .checkmark {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: block;
              margin: 0 auto 20px;
              background-color: #10b981;
              position: relative;
            }
            .checkmark:after {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -60%) rotate(45deg);
              width: 25px;
              height: 45px;
              border-right: 6px solid white;
              border-bottom: 6px solid white;
            }
            p { 
              color: #4b5563; 
              font-size: 1.1rem;
              line-height: 1.5;
            }
            .redirect {
              font-size: 0.9rem;
              color: #6b7280;
              margin-top: 20px;
            }
            .loader {
              display: inline-block;
              width: 20px;
              height: 20px;
              border: 3px solid rgba(16, 185, 129, 0.3);
              border-radius: 50%;
              border-top-color: #10b981;
              animation: spin 1s ease-in-out infinite;
              vertical-align: middle;
              margin-left: 8px;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="message">
            <div class="checkmark"></div>
            <h1>Pagamento Aprovado!</h1>
            <p>Seu pagamento foi confirmado com sucesso.</p>
            <p>Obrigado pela sua compra!</p>
            <p class="redirect">Redirecionando para página de confirmação <span class="loader"></span></p>
            <script>
              setTimeout(() => {
                window.location.href = "${window.location.origin}/success";
              }, 2500);
            </script>
          </div>
        </body>
      </html>
    `);
  }
  
  // Redirect current window after a short delay
  setTimeout(() => navigate("/success", {
    state: {
      order: {
        id: orderId,
        paymentMethod: 'pix',
        status: 'CONFIRMED'
      }
    }
  }), 1800);
};

// Separate function to handle failed payment redirection
const handleFailedPayment = (status: PaymentStatus, navigate: ReturnType<typeof useNavigate>, toast: ReturnType<typeof useToast>, setRedirecting: (val: boolean) => void) => {
  setRedirecting(true);
  toast({
    title: "Pagamento não aprovado",
    description: "Houve um problema com seu pagamento.",
    variant: "destructive",
  });
  
  // Redirect to failed page
  console.log("Redirecionando para página de falha após status:", status);
  setTimeout(() => navigate("/payment-failed"), 1500);
};

// Main hook function
export const usePixPaymentStatus = ({
  paymentId,
  orderId,
  expirationDate
}: UsePixPaymentStatusProps): UsePixPaymentStatusResult => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  
  // Use polling hook to check payment status
  const { status, isCheckingStatus, error, forceCheck } = usePaymentPolling(paymentId, 'PENDING');
  
  // Effect to redirect based on status
  useEffect(() => {
    if (redirecting) return;
    
    if (status === "CONFIRMED") {
      handlePaymentConfirmation(orderId, navigate, toast, setRedirecting);
    } else if (["CANCELLED", "REFUNDED", "OVERDUE"].includes(status)) {
      handleFailedPayment(status, navigate, toast, setRedirecting);
    }
  }, [status, navigate, toast, orderId, redirecting]);
  
  // Effect to update the time left counter
  useEffect(() => {
    const timer = setInterval(() => {
      const { timeLeftString, isExpired: newIsExpired } = calculateTimeLeft(expirationDate);
      setTimeLeft(timeLeftString);
      setIsExpired(newIsExpired);
    }, 1000);
    
    // Initialize values
    const initialTimeLeft = calculateTimeLeft(expirationDate);
    setTimeLeft(initialTimeLeft.timeLeftString);
    setIsExpired(initialTimeLeft.isExpired);
    
    return () => clearInterval(timer);
  }, [expirationDate]);

  return {
    status,
    timeLeft,
    isCheckingStatus,
    forceCheckStatus: forceCheck,
    isExpired
  };
};
