'use client';

import { useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ListingFeeNoticeDialog } from '@/components/admin/listing-fee-notice-dialog';

type Props = {
  skip: boolean;
  children: ReactNode;
};

export function ListingFeeGate({ skip, children }: Props) {
  const { isAdmin, loading } = useAuth();
  const [accepted, setAccepted] = useState(false);

  if (loading) return null;
  if (isAdmin || accepted || skip) return <>{children}</>;

  return <ListingFeeNoticeDialog onAccepted={() => setAccepted(true)} />;
}
