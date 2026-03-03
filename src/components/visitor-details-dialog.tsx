'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Visitor } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';

interface VisitorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitor: Visitor | null;
}

export function VisitorDetailsDialog({ open, onOpenChange, visitor }: VisitorDetailsDialogProps) {
  if (!visitor) return null;

  const downloadPhoto = async () => {
    if (!visitor.photo) return;
    const response = await fetch(visitor.photo);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${visitor.name.replace(/\s+/g, '_')}_photo.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Visitor Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex justify-center gap-4">
            {visitor.photo && (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100">
                  <Image src={visitor.photo} alt={visitor.name} fill className="object-cover" />
                </div>
                <Button variant="outline" size="sm" onClick={downloadPhoto}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Photo
                </Button>
              </div>
            )}
            {visitor.anniversary_photo && (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-4 border-gray-100">
                  <Image src={visitor.anniversary_photo} alt="Anniversary" fill className="object-cover" />
                </div>
                <Button variant="outline" size="sm" onClick={async () => {
                  const response = await fetch(visitor.anniversary_photo!);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${visitor.name.replace(/\s+/g, '_')}_anniversary.jpg`;
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
              <p className="font-medium">{visitor.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium font-mono">{visitor.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium capitalize">{visitor.gender}</p>
            </div>
            {visitor.marital_status && (
              <div>
                <p className="text-sm text-gray-500">Marital Status</p>
                <p className="font-medium capitalize">{visitor.marital_status}</p>
              </div>
            )}
            {visitor.birth_month && visitor.birth_day && (
              <div>
                <p className="text-sm text-gray-500">Birthday</p>
                <p className="font-medium">
                  {new Date(2000, visitor.birth_month - 1, visitor.birth_day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
            {visitor.anniversary_month && visitor.anniversary_day && (
              <div>
                <p className="text-sm text-gray-500">Anniversary</p>
                <p className="font-medium">
                  {new Date(2000, visitor.anniversary_month - 1, visitor.anniversary_day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
            {visitor.service && (
              <div>
                <p className="text-sm text-gray-500">Service Attended</p>
                <p className="font-medium">{visitor.service}</p>
              </div>
            )}
            {visitor.address && (
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{visitor.address}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Date Added</p>
              <p className="font-medium">{format(new Date(visitor.created_at!), 'MMM d, yyyy')}</p>
            </div>
          </div>
          
          {visitor.notes && (
            <div>
              <p className="text-sm text-gray-500">Notes</p>
              <p className="font-medium">{visitor.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
