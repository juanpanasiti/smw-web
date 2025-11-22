"use client";

import { forwardRef } from "react";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Date input component that uses native date picker but displays in dd-mm-yyyy format
 * Internally stores dates in yyyy-mm-dd format for compatibility with backend
 */
const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={onChange}
        className={className}
        {...props}
      />
    );
  }
);

DateInput.displayName = "DateInput";

export default DateInput;
