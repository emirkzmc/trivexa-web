import type { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <div className={`w-[400px] max-w-md rounded-2xl border border-trivexa-gray-400 bg-white p-8 py-20 shadow-2xl ${className} `}>
      {children}
    </div>
  );
}

