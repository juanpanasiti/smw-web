"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { formatDateToDDMMYYYY, formatDateToYYYYMMDD } from "@/lib/utils/dateFormat";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Date input component that displays in dd-mm-yyyy format
 * Internally stores dates in yyyy-mm-dd format for compatibility with backend
 * Uses a hidden date input to invoke the native date picker
 */
const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, className, name, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(formatDateToDDMMYYYY(value));
    const dateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setDisplayValue(formatDateToDDMMYYYY(value));
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      
      // Allow only numbers and dashes
      if (!/^[\d-]*$/.test(inputVal)) return;
      
      setDisplayValue(inputVal);

      // If it matches dd-mm-yyyy, try to update parent
      if (/^\d{2}-\d{2}-\d{4}$/.test(inputVal)) {
         const yyyymmdd = formatDateToYYYYMMDD(inputVal);
         // Basic validation via Date object
         if (yyyymmdd && !isNaN(new Date(yyyymmdd).getTime())) {
             const syntheticEvent = {
                 ...e,
                 target: {
                     ...e.target,
                     name: name || "",
                     value: yyyymmdd
                 }
             };
             onChange(syntheticEvent as unknown as React.ChangeEvent<HTMLInputElement>);
         }
      } else if (inputVal === "") {
        const syntheticEvent = {
            ...e,
            target: {
                ...e.target,
                name: name || "",
                value: ""
            }
        };
        onChange(syntheticEvent as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
    };

    const triggerDatePicker = () => {
        try {
            dateInputRef.current?.showPicker();
        } catch (error) {
            console.error("Browser does not support showPicker", error);
        }
    };

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          placeholder="DD-MM-YYYY"
          className={className}
          maxLength={10}
          {...props}
        />
        
        <button
          type="button"
          onClick={triggerDatePicker}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none"
          tabIndex={-1}
          title="Choose date"
        >
          <Calendar className="h-4 w-4" />
        </button>

        <input
          ref={dateInputRef}
          type="date"
          value={value}
          onChange={handleDatePickerChange}
          name={name}
          className="invisible absolute bottom-0 left-0 h-0 w-0 opacity-0"
          tabIndex={-1}
        />
      </div>
    );
  }
);

DateInput.displayName = "DateInput";

export default DateInput;
