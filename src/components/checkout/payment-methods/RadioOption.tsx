
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface RadioOptionProps {
  id: string;
  value: string;
  label: string;
  description?: string;  // Added description as an optional prop
  Icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  checked?: boolean;
  onChange?: () => void;
}

const RadioOption: React.FC<RadioOptionProps> = ({ 
  id, 
  value, 
  label, 
  description,
  Icon, 
  iconColor,
  className,
  checked,
  onChange
}) => {
  return (
    <div className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer ${
      value === 'creditCard' || value === 'card' ? 'border-green-500 bg-green-500/10' : 
      value === 'pix' ? 'border-green-500 bg-green-500/10' : 'border-gray-600'
    } ${className}`}>
      <RadioGroupItem value={value} id={id} checked={checked} onClick={onChange} />
      <Label htmlFor={id} className="flex flex-col cursor-pointer">
        <div className="flex items-center">
          {Icon && <Icon className={`h-5 w-5 mr-2 ${iconColor}`} />}
          {label}
        </div>
        {description && <span className="text-xs text-gray-500 mt-1">{description}</span>}
      </Label>
    </div>
  );
};

export default RadioOption;
