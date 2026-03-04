import type { ReactNode } from 'react';
import { Label } from './Label';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return <div className="auth-layout ">{children}
  <Label className='absolute left-0 bottom-0 text-3xl pl-9 pb-9 font-extralight' >
    TRIVEXA
  </Label>
  </div>;
}

