'use client';

import { useState, useEffect, ChangeEvent } from 'react';

interface Props {
  value?: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function CurrencyInput({ value, onChange, className, placeholder, style }: Props) {
  const [displayValue, setDisplayValue] = useState('');

  const formatCurrency = (val: number | string) => {
    if (val === undefined || val === null || val === '') return '';
    const numericStr = String(val).replace(/\D/g, '');
    if (!numericStr) return '';
    return Number(numericStr).toLocaleString('id-ID');
  };

  useEffect(() => {
    const currentNumeric = parseInt(displayValue.replace(/\D/g, '') || '0', 10);
    const incomingNumeric = value || 0;
    
    if (incomingNumeric !== currentNumeric) {
      setDisplayValue(incomingNumeric ? formatCurrency(incomingNumeric) : '');
    }
  }, [value, displayValue]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }
    
    const num = parseInt(raw, 10);
    setDisplayValue(formatCurrency(num));
    onChange(num);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      style={style}
      value={displayValue}
      onChange={handleChange}
    />
  );
}
