'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { promoteVisitorToMember } from '@/lib/db';
import { Visitor, MemberCategory } from '@/lib/types';
import { toast } from 'sonner';

interface PromoteToMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitor: Visitor | null;
  onSuccess: () => void;
}

export function PromoteToMemberDialog({ open, onOpenChange, visitor, onSuccess }: PromoteToMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<'adult' | 'youth' | 'children'>('adult');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const handlePromote = async () => {
    if (!visitor) return;
    
    setLoading(true);
    try {
      await promoteVisitorToMember(visitor.id!, {
        category,
        email: email || undefined,
        address: address || undefined,
      });
      
      toast.success(`${visitor.name} has been promoted to member!`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to promote visitor to member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote to Member</DialogTitle>
          <DialogDescription>
            Convert {visitor?.name} from visitor to church member
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Member Category</Label>
            <Select value={category} onValueChange={(value: MemberCategory) => setCategory(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adult">Adult</SelectItem>
                <SelectItem value="youth">Youth</SelectItem>
                <SelectItem value="children">Children</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Email (Optional)</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Address (Optional)</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePromote} disabled={loading}>
            {loading ? 'Promoting...' : 'Promote to Member'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
