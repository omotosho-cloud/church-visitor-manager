'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { MaritalStatus } from '@/lib/types';
import { ImageUpload } from '@/components/image-upload';
import { uploadPhoto } from '@/lib/db';

export default function MemberProfilePage() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    marital_status: '',
    anniversary_month: '',
    anniversary_day: '',
    birth_month: '',
    birth_day: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [anniversaryPhotoFile, setAnniversaryPhotoFile] = useState<File | null>(null);
  const [anniversaryPhotoUrl, setAnniversaryPhotoUrl] = useState<string>('');

  useState(() => {
    const fetchMember = async () => {
      try {
        const res = await fetch(`/api/member-profile/${token}`);
        if (!res.ok) throw new Error('Member not found');
        
        const member = await res.json();
        setFormData({
          name: member.name || '',
          phone: member.phone || '',
          email: member.email || '',
          address: member.address || '',
          marital_status: member.marital_status || '',
          anniversary_month: member.anniversary_month?.toString() || '',
          anniversary_day: member.anniversary_day?.toString() || '',
          birth_month: member.birth_month?.toString() || '',
          birth_day: member.birth_day?.toString() || '',
        });
        setPhotoUrl(member.photo || '');
        setAnniversaryPhotoUrl(member.anniversary_photo || '');
      } catch (error) {
        toast.error('Invalid or expired profile link');
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  });

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Full name is required';
    if (!formData.phone.trim()) return 'Phone number is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);

    try {
      let uploadedPhotoUrl = photoUrl;
      if (photoFile) {
        try {
          uploadedPhotoUrl = await uploadPhoto(photoFile, 'member');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload birthday photo';
          toast.error(errorMessage);
          setSaving(false);
          return;
        }
      }

      let uploadedAnniversaryPhotoUrl = anniversaryPhotoUrl;
      if (anniversaryPhotoFile) {
        try {
          uploadedAnniversaryPhotoUrl = await uploadPhoto(anniversaryPhotoFile, 'member');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload anniversary photo';
          toast.error(errorMessage);
          setSaving(false);
          return;
        }
      }

      const updateData = {
        ...formData,
        marital_status: formData.marital_status || undefined,
        anniversary_month: formData.anniversary_month ? parseInt(formData.anniversary_month) : undefined,
        anniversary_day: formData.anniversary_day ? parseInt(formData.anniversary_day) : undefined,
        anniversary_photo: uploadedAnniversaryPhotoUrl || undefined,
        birth_month: formData.birth_month ? parseInt(formData.birth_month) : undefined,
        birth_day: formData.birth_day ? parseInt(formData.birth_day) : undefined,
        photo: uploadedPhotoUrl || undefined,
      };

      const res = await fetch(`/api/member-profile/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      toast.success('Profile updated successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Toaster position="top-right" richColors />
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Your Profile</CardTitle>
            <CardDescription>Update your member information</CardDescription>
          </CardHeader>
          <CardContent>
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
                  <Label>Birthday Photo</Label>
                  <ImageUpload
                    value={photoUrl}
                    onChange={setPhotoUrl}
                    onFileSelect={setPhotoFile}
                  />
                </div>
                {formData.marital_status === 'married' && (
                  <div className="space-y-2">
                    <Label>Anniversary Photo</Label>
                    <ImageUpload
                      value={anniversaryPhotoUrl}
                      onChange={setAnniversaryPhotoUrl}
                      onFileSelect={setAnniversaryPhotoFile}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              {formData.marital_status === 'married' && (
                <div className="grid grid-cols-2 gap-4">
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
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
