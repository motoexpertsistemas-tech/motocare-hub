import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toBRL, fromBRL } from "@/lib/utils";

interface BRLInputProps {
  value: string | number;
  onChange: (dotValue: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
  prefix?: string;
}

/**
 * Input that displays values in Brazilian format (comma decimal, 2 places)
 * but stores internally as dot-decimal string.
 */
export function BRLInput({ value, onChange, className = "", readOnly, placeholder, prefix }: BRLInputProps) {
  const [display, setDisplay] = useState(() => toBRL(value));

  useEffect(() => {
    setDisplay(toBRL(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits, comma and dot (thousands separator)
    const raw = e.target.value.replace(/[^0-9.,]/g, "");
    setDisplay(raw);
  };

  const handleBlur = () => {
    const dotVal = fromBRL(display);
    const num = parseFloat(dotVal) || 0;
    const fixed = num.toFixed(2);
    onChange(fixed);
    setDisplay(toBRL(fixed));
  };

  const isPrimaryBg = className.includes("text-primary-foreground");

  return (
    <div className={`relative ${isPrimaryBg ? "text-primary-foreground" : ""}`}>
      {prefix && (
        <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none ${isPrimaryBg ? "text-white/80" : "text-muted-foreground"}`}>
          {prefix}
        </span>
      )}
      <Input
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`${prefix ? "pl-8" : ""} ${className}`}
      />
    </div>
  );
}
