'use client';

import { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SMALL_SCREEN_NOTICE_KEY } from '@/components/layout/small-screen-gate';

export function SmallScreenNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SMALL_SCREEN_NOTICE_KEY)) setOpen(true);
  }, []);

  const dismiss = () => {
    sessionStorage.removeItem(SMALL_SCREEN_NOTICE_KEY);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            A larger screen is needed
          </DialogTitle>
          <DialogDescription>
            The MapMyLED tools (Pixel Map, LED Calculator, Power &amp; Data, Rack Drawing, Signal Flow, and
            Pre-Visual) need a bigger display. You can still browse the public pages here. Open MapMyLED on a
            tablet or computer to use the tools.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end">
          <Button onClick={dismiss}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
