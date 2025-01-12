import React from "react";
import { Check } from "lucide-react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean, event: React.MouseEvent | React.KeyboardEvent) => void;
  disabled?: boolean;
  className?: string;
}

const CustomCheckbox = React.forwardRef<HTMLDivElement, CustomCheckboxProps>(
  ({ checked, onChange, disabled = false, className = '' }, ref) => {
    const handleClick = (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) {
        onChange(!checked, event);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        event.stopPropagation();
        onChange(!checked, event);
      }
    };

    return (
      <div 
        ref={ref}
        role="checkbox"
        tabIndex={disabled ? -1 : 0}
        aria-checked={checked}
        aria-disabled={disabled}
        className={`
          w-5 h-5 border-2 rounded 
          ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
          transition-colors duration-200 ease-in-out
          flex items-center justify-center
          ${className}
        `}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {checked && (
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        )}
      </div>
    );
  }
);

CustomCheckbox.displayName = 'CustomCheckbox';

export default CustomCheckbox;