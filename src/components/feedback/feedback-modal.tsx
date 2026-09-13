'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { MessageSquare, Loader2 } from 'lucide-react';

export type FeedbackCategory = 'bug_report' | 'feature_request' | 'suggestion' | 'correction' | 'other';

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  suggestion: 'Suggestion',
  correction: 'Correction',
  other: 'Other',
};

const DOWNLOAD_TYPE_LABELS: Record<string, string> = {
  grid_png: 'Grid PNG',
  wiring_diagram: 'Wiring Diagram',
  composite_wiring: 'Composite Wiring',
  raster_map: 'Raster Map',
  raster_slices: 'Raster Slices',
  wall_layout: 'Wall Layout',
  equipment_csv: 'Equipment List CSV',
  equipment_png: 'Equipment List PNG',
  equipment_pdf: 'Equipment List PDF',
  deliverables_pdf: 'Deliverables PDF',
  deliverables_html: 'Deliverables HTML',
  deliverables_pixel_map: 'Deliverables Pixel Map',
  rack_png: 'Rack Drawing PNG',
};

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  downloadType: string;
  onDontShowAgain?: () => void;
}

export function FeedbackModal({ open, onOpenChange, downloadType, onDontShowAgain }: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({ title: 'Please enter your feedback', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('download_feedback').insert({
        category,
        download_type: downloadType,
        message: message.trim(),
        submitter_name: isAnonymous ? null : (name.trim() || null),
        submitter_email: isAnonymous ? null : (email.trim() || user?.email || null),
        is_anonymous: isAnonymous,
        user_id: user?.id || null,
      });

      if (error) throw error;

      toast({ title: 'Thank you! Your feedback has been submitted.' });
      if (dontShowAgain && onDontShowAgain) {
        onDontShowAgain();
      }
      onOpenChange(false);
      setMessage('');
      setName('');
      setEmail('');
      setDontShowAgain(false);
    } catch (err) {
      toast({ title: 'Failed to submit feedback. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setMessage('');
      setDontShowAgain(false);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve MapMyLED. Your feedback on the {DOWNLOAD_TYPE_LABELS[downloadType] ?? downloadType} download is valuable to us.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORY_LABELS) as [FeedbackCategory, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Your Feedback</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your suggestion, bug, correction, or feature idea..."
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              />
              <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
                Submit anonymously
              </Label>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={email || user?.email || ''}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                  />
                </div>
              </div>
            )}
          </div>

          {onDontShowAgain && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <Label htmlFor="dont-show" className="text-sm font-normal cursor-pointer">
                Don&apos;t show this prompt again
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !message.trim()}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
