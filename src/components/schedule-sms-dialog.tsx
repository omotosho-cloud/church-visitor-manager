'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { ControllerRenderProps } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTemplates, getVisitors, createQueuedMessage, getTemplate } from '@/lib/db';
import { Template, Visitor, MessageQueueItem } from '@/lib/types';
import { toast } from 'sonner';

const formSchema = z.object({
  template_id: z.string().min(1, 'Please select a template'),
  target: z.enum(['all', 'date_range']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  scheduled_at: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ScheduleSmsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ScheduleSmsDialog({ open, onOpenChange, onSuccess }: ScheduleSmsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const fetchTemplatesData = async () => {
      const items = await getTemplates();
      setTemplates(items);
    };
    if (open) fetchTemplatesData();
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template_id: '',
      target: 'all',
      start_date: '',
      end_date: '',
      scheduled_at: new Date().toISOString().slice(0, 16),
    },
  });

  const targetType = form.watch('target');

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      
      const visitors = await getVisitors();
      const template = await getTemplate(values.template_id);
      const scheduledTime = values.scheduled_at ? new Date(values.scheduled_at).toISOString() : new Date().toISOString();
      
      let count = 0;
      for (const visitor of visitors) {
        // Filter by date range if selected
        if (values.target === 'date_range') {
          const startTime = values.start_date ? new Date(values.start_date).getTime() : 0;
          const endTime = values.end_date ? new Date(values.end_date).getTime() : Date.now();
          const visitorTime = new Date(visitor.created_at!).getTime();
          if (visitorTime < startTime || visitorTime > endTime) {
            continue;
          }
        }
        
        await createQueuedMessage({
          visitor_id: visitor.id!,
          template_id: values.template_id,
          phone: visitor.phone,
          message: template.message,
          scheduled_for: scheduledTime,
          status: 'pending',
        });
        count++;
      }

      toast.success(`Enqueued ${count} messages successfully!`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling SMS:', error);
      toast.error('Failed to schedule messages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Broadcast Message</DialogTitle>
          <DialogDescription>
            Send an SMS to all registered visitors or a specific group.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="template_id"
              render={({ field }: { field: ControllerRenderProps<FormValues, 'template_id'> }) => (
                <FormItem>
                  <FormLabel>Select Template</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id!}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target"
              render={({ field }: { field: ControllerRenderProps<FormValues, 'target'> }) => (
                <FormItem>
                  <FormLabel>Recipients</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Visitors</SelectItem>
                      <SelectItem value="date_range">Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {targetType === 'date_range' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }: { field: ControllerRenderProps<FormValues, 'start_date'> }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <input 
                          type="date" 
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }: { field: ControllerRenderProps<FormValues, 'end_date'> }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <input 
                          type="date" 
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="scheduled_at"
              render={({ field }: { field: ControllerRenderProps<FormValues, 'scheduled_at'> }) => (
                <FormItem>
                  <FormLabel>Schedule For</FormLabel>
                  <FormControl>
                    <input 
                      type="datetime-local" 
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Leave as is to send as soon as possible.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : 'Broadcast Message'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
