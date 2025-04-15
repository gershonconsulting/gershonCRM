import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X } from 'lucide-react';

interface EditableFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (newValue: string) => void;
  isLink?: boolean;
  isRequired?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  placeholder = 'Not specified',
  onChange,
  isLink = false,
  isRequired = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const displayValue = value || placeholder;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <p className="text-xs text-gray-500">
          {label}{isRequired && <span className="text-red-500">*</span>}
        </p>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleSave}
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ) : isLink && value ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm">{displayValue}</p>
      )}
    </div>
  );
};

export default EditableField;