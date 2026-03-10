'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, Check } from 'lucide-react';
import { Member } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { toast } from 'sonner';

interface MemberDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
}

export function MemberDetailsDialog({ open, onOpenChange, member }: MemberDetailsDialogProps) {
  const [copied, setCopied] = useState(false);
  
  if (!member) return null;

  const profileLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/member-profile/${member.profile_token}`;

  const downloadPhoto = async () => {
    if (!member.photo) return;
    const response = await fetch(member.photo);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${member.name.replace(/\s+/g, '_')}_photo.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileLink);
      setCopied(true);
      toast.success('Profile link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex justify-center gap-4">
            {member.photo && (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100">
                  <Image src={member.photo} alt={member.name} fill className="object-cover" />
                </div>
                <Button variant="outline" size="sm" onClick={downloadPhoto}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Photo
                </Button>
              </div>
            )}
            {member.anniversary_photo && (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-4 border-gray-100">
                  <Image src={member.anniversary_photo} alt="Anniversary" fill className="object-cover" />
                </div>
                <Button variant="outline" size="sm" onClick={async () => {
                  const response = await fetch(member.anniversary_photo!);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${member.name.replace(/\s+/g, '_')}_anniversary.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Anniversary
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{member.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium font-mono">{member.phone}</p>
            </div>
            {member.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{member.email}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium capitalize">{member.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <Badge variant="outline" className="capitalize">{member.category}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={member.membership_status === 'active' ? 'default' : 'secondary'} className="capitalize">
                {member.membership_status}
              </Badge>
            </div>
            {member.marital_status && (
              <div>
                <p className="text-sm text-gray-500">Marital Status</p>
                <p className="font-medium capitalize">{member.marital_status}</p>
              </div>
            )}
            {member.birth_month && member.birth_day && (
              <div>
                <p className="text-sm text-gray-500">Birthday</p>
                <p className="font-medium">
                  {new Date(2000, member.birth_month - 1, member.birth_day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
            {member.anniversary_month && member.anniversary_day && (
              <div>
                <p className="text-sm text-gray-500">Anniversary</p>
                <p className="font-medium">
                  {new Date(2000, member.anniversary_month - 1, member.anniversary_day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
            {member.join_date && (
              <div>
                <p className="text-sm text-gray-500">Join Date</p>
                <p className="font-medium">{format(new Date(member.join_date), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>
          
          {member.address && (
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{member.address}</p>
            </div>
          )}
          
          {member.notes && (
            <div>
              <p className="text-sm text-gray-500">Notes</p>
              <p className="font-medium">{member.notes}</p>
            </div>
          )}
          
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">Profile Edit Link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={profileLink}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Share this link with the member to allow them to edit their profile</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
