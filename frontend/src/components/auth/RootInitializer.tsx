// src/components/auth/RootInitializer.tsx
import { ReactNode } from 'react';
import { useAuthInit, useAuth } from '@/hooks/useAuth';

interface RootInitializerProps {
  children: ReactNode;
}

export default function RootInitializer({ children }: RootInitializerProps) {
  const { isLoading } = useAuth();
  useAuthInit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loader" /> {/* Replace with your spinner component */}
      </div>
    );
  }

  return <>{children}</>;
}