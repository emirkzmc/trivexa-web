import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

// Generic text input used across auth screens
export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-md border border-trivexa-blue-300 px-3 py-2 text-sm outline-none ${className}`}
      {...props}
    />
  );
}

