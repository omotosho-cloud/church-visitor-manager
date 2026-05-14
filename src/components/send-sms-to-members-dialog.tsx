'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Member } from '@/lib/types';
import { toast } from 'sonner';

interface SendSmsToMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMembers: Member[];
  onSuccess: () => void;
}

export function SendSmsToMembersDialog({ open, onOpenChange, selectedMembers, onSuccess }: SendSmsToMembersDialogProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const res = await fetch('/api/send-bulk-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitors: selectedMembers, message }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      successCount = data.successCount;
      failCount = data.failCount;

      if (successCount > 0) toast.success(`SMS sent to ${successCount} member(s)`);
      if (failCount > 0) toast.warning(`Failed to send to ${failCount} member(s)`);

      onSuccess();
      onOpenChange(false);
      setMessage('');
    } catch (error) {
      toast.error('Failed to send SMS to members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send SMS to Members</DialogTitle>
          <DialogDescription>
            Send a message to {selectedMembers.length} selected member(s)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={loading || !message.trim()}>
            {loading ? 'Sending...' : `Send to ${selectedMembers.length} Member(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
