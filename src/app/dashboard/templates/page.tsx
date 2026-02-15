'use client';

import { useEffect, useState } from 'react';
import { Plus, FileText, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTemplates, deleteTemplate as dbDeleteTemplate } from '@/lib/db';
import { Template } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from 'sonner';
import { AddTemplateDialog } from '@/components/add-template-dialog';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const items = await getTemplates();
      setTemplates(items);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await dbDeleteTemplate(id);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Message Templates</h1>
          <p className="text-muted-foreground">Create and manage SMS templates for automated follow-ups.</p>
        </div>
        <Button 
            className="flex items-center gap-2"
            onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <AddTemplateDialog 
        open={isDialogOpen || !!editingTemplate} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTemplate(null);
        }} 
        onSuccess={fetchTemplates}
        editTemplate={editingTemplate}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div>Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            No templates found. Create one to get started.
          </div>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={template.trigger_type === 'instant' ? 'default' : 'secondary'}>
                    {template.trigger_type}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTemplate(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => template.id && deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-2 text-xl">{template.name}</CardTitle>
                <CardDescription className="line-clamp-3 bg-muted/50 p-2 rounded mt-2 text-xs font-mono">
                  {template.message}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                   <p>Variables: <code className="text-primary">{"{{name}}"}</code>, <code className="text-primary">{"{{church_name}}"}</code></p>
                   {template.delay_days !== undefined && (
                       <p>Delay: {template.delay_days} days</p>
                   )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
