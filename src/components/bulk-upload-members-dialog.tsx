'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BulkUploadMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkUploadMembersDialog({ open, onOpenChange, onSuccess }: BulkUploadMembersDialogProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const downloadTemplate = () => {
    const csv = 'Name,Phone,Email,Gender,Category,Status,Address,Notes\nJohn Doe,08012345678,john@example.com,male,adult,active,123 Main St,\nJane Smith,08087654321,jane@example.com,female,youth,active,456 Oak Ave,';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/bulk-upload-members', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Upload failed');
        return;
      }

      toast.success(`${data.success} members added successfully!`);
      if (data.errors > 0) {
        toast.warning(`${data.errors} rows had errors and were skipped`);
      }
      
      setFile(null);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Upload Members</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple members at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">CSV Format Required:</p>
              <p className="text-xs mt-1">Name, Phone, Email, Gender (male/female), Category (adult/youth/children), Status (active/inactive/transferred), Address, Notes</p>
            </div>
          </div>

          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload-members"
            />
            <label htmlFor="csv-upload-members" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                {file ? file.name : 'Click to select CSV file'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV files only
              </p>
            </label>
          </div>

          <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
            {loading ? 'Uploading...' : 'Upload Members'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
