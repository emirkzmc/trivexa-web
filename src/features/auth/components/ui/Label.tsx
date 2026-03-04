import type { LabelHTMLAttributes, ReactNode } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export function Label({ htmlFor, children, className = '', ...rest }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-1 block font-normal ${className}`}
      {...rest}
    >
      {children}
    </label>
  );
}

