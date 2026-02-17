'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Visitor, Template } from '@/lib/types';
import { getTemplates } from '@/lib/db';
import { toast } from 'sonner';

interface SendSmsToSelectedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVisitors: Visitor[];
  onSuccess: () => void;
}

export function SendSmsToSelectedDialog({ 
  open, 
  onOpenChange, 
  selectedVisitors,
  onSuccess 
}: SendSmsToSelectedDialogProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    if (open) {
      getTemplates().then(setTemplates).catch(console.error);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedVisitors.length === 0) {
      toast.error('No visitors selected');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/send-bulk-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitors: selectedVisitors,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`SMS sent to ${data.successCount} of ${data.total} visitors`);
        if (data.failCount > 0) {
          toast.warning(`${data.failCount} messages failed to send`);
        }
        setMessage('');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send SMS to Selected Visitors</DialogTitle>
          <DialogDescription>
            Send a message to {selectedVisitors.length} selected visitor{selectedVisitors.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Quick Select Template</Label>
              <Select onValueChange={(value) => setMessage(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.message}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={160}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/160 characters
            </p>
          </div>

          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium mb-2">Selected Visitors:</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedVisitors.map((visitor) => (
                <div key={visitor.id} className="text-xs flex justify-between">
                  <span>{visitor.name}</span>
                  <span className="text-muted-foreground font-mono">{visitor.phone}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !message.trim()}>
              {loading ? 'Sending...' : 'Send SMS'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
