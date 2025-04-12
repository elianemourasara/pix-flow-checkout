
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckoutCustomizationSettings } from '@/types/customization';

interface ProductTabProps {
  settings: CheckoutCustomizationSettings;
  handleSwitchChange: (name: string, checked: boolean) => void;
}

export const ProductTab: React.FC<ProductTabProps> = ({ settings, handleSwitchChange }) => (
  <Card>
    <CardHeader>
      <CardTitle>Configurações do Produto</CardTitle>
      <CardDescription>
        Configure as propriedades relacionadas ao produto.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch 
          id="isDigitalProduct"
          checked={settings.isDigitalProduct}
          onCheckedChange={(checked) => handleSwitchChange('isDigitalProduct', checked)}
        />
        <Label htmlFor="isDigitalProduct">Produto Digital</Label>
      </div>
    </CardContent>
  </Card>
);
