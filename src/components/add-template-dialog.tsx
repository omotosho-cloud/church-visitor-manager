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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTemplate, updateTemplate } from '@/lib/db';
import { toast } from 'sonner';
import { Template } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  message: z.string().min(10, 'Message body is too short'),
  trigger_type: z.enum(['instant', 'delay', 'scheduled']),
  delay_days: z.number().min(0).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editTemplate?: Template | null;
}

export function AddTemplateDialog({ open, onOpenChange, onSuccess, editTemplate }: AddTemplateDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      message: 'Hi {{name}}, welcome to {{church_name}}! We are glad you joined our {{service_attended}} service.',
      trigger_type: 'instant',
      delay_days: 0,
    },
  });

  useEffect(() => {
    if (editTemplate) {
      form.reset({
        name: editTemplate.name,
        message: editTemplate.message,
        trigger_type: editTemplate.trigger_type,
        delay_days: editTemplate.delay_days || 0,
      });
    }
  }, [editTemplate, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      
      if (editTemplate) {
        await updateTemplate(editTemplate.id!, values);
        toast.success('Template updated successfully!');
      } else {
        await createTemplate(values);
        toast.success('Template created successfully!');
      }
      
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const triggerType = form.watch('trigger_type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editTemplate ? 'Edit Template' : 'Create Message Template'}</DialogTitle>
          <DialogDescription>
            Design an automated message structure. Use {"{{name}}"}, {"{{church_name}}"}, and {"{{service_attended}}"} as variables.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Welcome Message" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Message Body</FormLabel>
                  <FormControl>
                    <textarea 
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Type your message here..."
                        {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Variables will be replaced with actual visitor data.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="trigger_type"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Trigger Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="instant">Instant</SelectItem>
                        <SelectItem value="delay">Delay (Follow-up)</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {triggerType === 'delay' && (
                <FormField
                  control={form.control}
                  name="delay_days"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Delay (Days)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (editTemplate ? 'Updating...' : 'Creating...') : (editTemplate ? 'Update Template' : 'Create Template')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
