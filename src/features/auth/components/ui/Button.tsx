import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
  variant?: ButtonVariant;
}

export function Button({
  type = 'button',
  children,
  disabled = false,
  className = '',
  fullWidth = true,
  variant = 'primary',
  ...rest
}: ButtonProps) {
  const baseClasses =
    'rounded-md py-2 text-sm font-medium disabled:opacity-70 transition-colors';

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-trivexa-black text-trivexa-white hover:bg-trivexa-gray-700 focus:bg-trivexa-gray-500',
    secondary: 'bg-trivexa-gray-300 text-trivexa-black',
    outline:
      'border border-trivexa-black text-trivexa-black bg-transparent hover:bg-trivexa-gray-150',
    ghost: 'bg-transparent text-trivexa-black hover:bg-trivexa-gray-150',
    danger: 'bg-trivexa-red-400 text-trivexa-white',
  };

  const resolvedVariant = variantClasses[variant] ?? variantClasses.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${resolvedVariant} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

