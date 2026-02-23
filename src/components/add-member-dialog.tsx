'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createMember, updateMember } from '@/lib/db';
import { Member, MembershipStatus, MemberCategory, MaritalStatus } from '@/lib/types';
import { toast } from 'sonner';
import { validatePhone } from '@/lib/utils';
import { MESSAGES } from '@/lib/constants';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editMember?: Member | null;
}

export function AddMemberDialog({ open, onOpenChange, onSuccess, editMember }: AddMemberDialogProps) {
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    gender: string;
    marital_status: string;
    anniversary_month: string;
    anniversary_day: string;
    birth_month: string;
    birth_day: string;
    address: string;
    membership_status: MembershipStatus;
    category: MemberCategory;
    join_date: string;
    notes: string;
  }>({
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    marital_status: '',
    anniversary_month: '',
    anniversary_day: '',
    birth_month: '',
    birth_day: '',
    address: '',
    membership_status: 'active',
    category: 'adult',
    join_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editMember) {
      setFormData({
        name: editMember.name,
        phone: editMember.phone,
        email: editMember.email || '',
        gender: editMember.gender,
        marital_status: editMember.marital_status || '',
        anniversary_month: editMember.anniversary_month?.toString() || '',
        anniversary_day: editMember.anniversary_day?.toString() || '',
        birth_month: editMember.birth_month?.toString() || '',
        birth_day: editMember.birth_day?.toString() || '',
        address: editMember.address || '',
        membership_status: editMember.membership_status,
        category: editMember.category,
        join_date: editMember.join_date || new Date().toISOString().split('T')[0],
        notes: editMember.notes || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        gender: 'male',
        marital_status: '',
        anniversary_month: '',
        anniversary_day: '',
        birth_month: '',
        birth_day: '',
        address: '',
        membership_status: 'active',
        category: 'adult',
        join_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [editMember, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(formData.phone)) {
      toast.error(MESSAGES.ERROR.INVALID_PHONE);
      return;
    }
    
    setLoading(true);

    try {
      const memberData = {
        ...formData,
        marital_status: (formData.marital_status as MaritalStatus) || undefined,
        anniversary_month: formData.anniversary_month ? parseInt(formData.anniversary_month) : undefined,
        anniversary_day: formData.anniversary_day ? parseInt(formData.anniversary_day) : undefined,
        birth_month: formData.birth_month ? parseInt(formData.birth_month) : undefined,
        birth_day: formData.birth_day ? parseInt(formData.birth_day) : undefined,
      };

      if (editMember) {
        await updateMember(editMember.id!, memberData);
        toast.success(MESSAGES.SUCCESS.MEMBER_UPDATED);
      } else {
        await createMember(memberData);
        toast.success(MESSAGES.SUCCESS.MEMBER_ADDED);
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(editMember ? 'Failed to update member' : 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMember ? 'Edit Member' : 'Add New Member'}</DialogTitle>
          <DialogDescription>
            {editMember ? 'Update member information' : 'Enter member details'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marital_status">Marital Status</Label>
              <Select value={formData.marital_status} onValueChange={(value: MaritalStatus) => setFormData({ ...formData, marital_status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.marital_status === 'married' && (
              <div className="space-y-2">
                <Label htmlFor="anniversary_month">Anniversary Month</Label>
                <Select value={formData.anniversary_month} onValueChange={(value) => setFormData({ ...formData, anniversary_month: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-50">
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2000, i).toLocaleDateString('en-US', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_month">Birth Month</Label>
              <Select value={formData.birth_month} onValueChange={(value) => setFormData({ ...formData, birth_month: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-50">
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2000, i).toLocaleDateString('en-US', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_day">Birth Day</Label>
              <Select value={formData.birth_day} onValueChange={(value) => setFormData({ ...formData, birth_day: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-50">
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.marital_status === 'married' && (
              <div className="space-y-2">
                <Label htmlFor="anniversary_day">Anniversary Day</Label>
                <Select value={formData.anniversary_day} onValueChange={(value) => setFormData({ ...formData, anniversary_day: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-50">
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.marital_status !== 'married' && (
              <div className="space-y-2">
                <Label htmlFor="join_date">Join Date</Label>
                <Input
                  id="join_date"
                  type="date"
                  value={formData.join_date}
                  onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value: MemberCategory) => setFormData({ ...formData, category: value })}>
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
              <Label htmlFor="status">Membership Status *</Label>
              <Select value={formData.membership_status} onValueChange={(value: MembershipStatus) => setFormData({ ...formData, membership_status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editMember ? 'Update Member' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
