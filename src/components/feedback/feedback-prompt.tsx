'use client';

import { useState, useCallback, useEffect } from 'react';
import { FeedbackModal } from './feedback-modal';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Megaphone } from 'lucide-react';

const STORAGE_KEY = 'mapmyled:feedback-dismissed';

export function isFeedbackPromptDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function dismissFeedbackPrompt() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, 'true');
}

export function showFeedbackPrompt(downloadType: string) {
  if (typeof window === 'undefined') return;
  if (isFeedbackPromptDismissed()) return;

  window.dispatchEvent(new CustomEvent('mapmyled:show-feedback', { detail: { downloadType } }));
}

export function FeedbackPromptProvider({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadType, setDownloadType] = useState('');
  const { toast } = useToast();

  const openModal = useCallback((type: string) => {
    setDownloadType(type);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.downloadType) {
        toast({
          title: 'Download complete',
          description: 'How was the download? Your feedback helps us improve.',
          action: (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openModal(detail.downloadType)}
              className="gap-1.5"
            >
              <Megaphone className="h-3.5 w-3.5" />
              Give Feedback
            </Button>
          ),
        });
      }
    };
    window.addEventListener('mapmyled:show-feedback', handler);
    return () => window.removeEventListener('mapmyled:show-feedback', handler);
  }, [toast, openModal]);

  return (
    <>
      {children}
      <FeedbackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        downloadType={downloadType}
        onDontShowAgain={dismissFeedbackPrompt}
      />
    </>
  );
}
