
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';

interface PixStatusCheckProps {
  checking: boolean;
  onCheck: () => void;
}

export const PixStatusCheck: React.FC<PixStatusCheckProps> = ({ checking, onCheck }) => {
  return (
    <div className="pt-2">
      <Button 
        onClick={onCheck} 
        disabled={checking}
        variant="outline"
        className="w-full"
      >
        {checking ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        Verificar pagamento
      </Button>
    </div>
  );
};
