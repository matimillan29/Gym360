import { useState, useEffect, useRef } from 'react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export default function DateInput({ value, onChange, required, className }: DateInputProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Parse incoming value
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setYear(y || '');
      setMonth(m || '');
      setDay(d || '');
    }
  }, [value]);

  // Update parent when parts change
  const updateValue = (d: string, m: string, y: string) => {
    if (d && m && y && d.length === 2 && m.length === 2 && y.length === 4) {
      onChange(`${y}-${m}-${d}`);
    } else if (!d && !m && !y) {
      onChange('');
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDay(val);
    updateValue(val, month, year);
    // Auto-advance when 2 digits entered and value is valid
    if (val.length === 2 && parseInt(val) >= 1 && parseInt(val) <= 31) {
      monthRef.current?.focus();
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMonth(val);
    updateValue(day, val, year);
    // Auto-advance when 2 digits entered and value is valid
    if (val.length === 2 && parseInt(val) >= 1 && parseInt(val) <= 12) {
      yearRef.current?.focus();
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    updateValue(day, month, val);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentValue: string,
    prevRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    if (e.key === 'Backspace' && currentValue === '' && prevRef) {
      prevRef.current?.focus();
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD"
        value={day}
        onChange={handleDayChange}
        maxLength={2}
        required={required}
        className="w-12 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
      />
      <span className="text-gray-400">/</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        placeholder="MM"
        value={month}
        onChange={handleMonthChange}
        onKeyDown={(e) => handleKeyDown(e, month)}
        maxLength={2}
        required={required}
        className="w-12 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
      />
      <span className="text-gray-400">/</span>
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        placeholder="AAAA"
        value={year}
        onChange={handleYearChange}
        onKeyDown={(e) => handleKeyDown(e, year, monthRef)}
        maxLength={4}
        required={required}
        className="w-16 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
      />
    </div>
  );
}
