'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Member } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getCategoryColor } from '@/lib/utils';

interface ViewMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
}

export function ViewMemberDialog({ open, onOpenChange, member }: ViewMemberDialogProps) {
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
          <DialogDescription>
            View complete member information
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{member.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-mono text-sm">{member.phone}</p>
          </div>
          {member.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm">{member.email}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="capitalize">{member.gender}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Marital Status</p>
              <p className="capitalize">{member.marital_status || 'Not set'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Birthday</p>
              <p>
                {member.birth_month && member.birth_day 
                  ? `${new Date(2000, member.birth_month - 1, member.birth_day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                  : 'Not set'
                }
              </p>
            </div>
            {member.marital_status === 'married' && member.anniversary_month && member.anniversary_day && (
              <div>
                <p className="text-sm text-muted-foreground">Anniversary</p>
                <p>
                  {new Date(2000, member.anniversary_month - 1, member.anniversary_day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <Badge variant="outline" className={getCategoryColor(member.category)}>
                {member.category}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="outline" className={getStatusColor(member.membership_status)}>
                {member.membership_status}
              </Badge>
            </div>
          </div>
          {member.address && (
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="text-sm">{member.address}</p>
            </div>
          )}
          {member.join_date && (
            <div>
              <p className="text-sm text-muted-foreground">Join Date</p>
              <p className="text-sm">{new Date(member.join_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          )}
          {member.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{member.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
