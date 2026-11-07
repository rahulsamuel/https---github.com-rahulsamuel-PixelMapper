'use client';

import { useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ListingFeeNoticeDialog } from '@/components/admin/listing-fee-notice-dialog';

export function ListingFeeGate({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();
  const [accepted, setAccepted] = useState(false);

  if (loading) return null;
  if (isAdmin || accepted) return <>{children}</>;

  return <ListingFeeNoticeDialog onAccepted={() => setAccepted(true)} />;
}
