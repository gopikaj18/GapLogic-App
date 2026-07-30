'use client';

import { ReactNode } from 'react';

// Protection removed. This component now simply renders its children.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
