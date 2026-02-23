'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ControllerRenderProps } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getServices, createVisitor, updateVisitor, getVisitors, getTemplates, createMessageLog, createQueuedMessage } from '@/lib/db';
import { toast } from 'sonner';
import { sendSms } from '@/lib/sms';
import {  Visitor, MaritalStatus } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  gender: z.string().min(1, 'Please select gender'),
  marital_status: z.string().optional(),
  anniversary_month: z.string().optional(),
  anniversary_day: z.string().optional(),
  birth_month: z.string().optional(),
  birth_day: z.string().optional(),
  service: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddVisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editVisitor?: Visitor | null;
}

export function AddVisitorDialog({ open, onOpenChange, onSuccess, editVisitor }: AddVisitorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<string[]>(['Sunday Morning', 'Sunday Evening', 'Wednesday Service', 'Friday Service']);

  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    if (open) fetchServicesData();
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      gender: '',
      marital_status: '',
      anniversary_month: '',
      anniversary_day: '',
      birth_month: '',
      birth_day: '',
      service: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (editVisitor) {
      form.reset({
        name: editVisitor.name,
        phone: editVisitor.phone,
        gender: editVisitor.gender,
        marital_status: editVisitor.marital_status || '',
        anniversary_month: editVisitor.anniversary_month?.toString() || '',
        anniversary_day: editVisitor.anniversary_day?.toString() || '',
        birth_month: editVisitor.birth_month?.toString() || '',
        birth_day: editVisitor.birth_day?.toString() || '',
        service: editVisitor.service || '',
        notes: editVisitor.notes || '',
      });
    } else {
      form.reset({
        name: '',
        phone: '',
        gender: '',
        marital_status: '',
        anniversary_month: '',
        anniversary_day: '',
        birth_month: '',
        birth_day: '',
        service: '',
        notes: '',
      });
    }
  }, [editVisitor, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      
      // Check for duplicate phone (skip if editing same visitor)
      const allVisitors = await getVisitors();
      const duplicate = allVisitors.find(v => v.phone === values.phone && v.id !== editVisitor?.id);
      if (duplicate) {
        toast.error('Visitor with this phone number already exists');
        setLoading(false);
        return;
      }

      // Convert birth_month and birth_day to numbers
      const visitorData = {
        name: values.name,
        phone: values.phone,
        gender: values.gender,
        marital_status: (values.marital_status as MaritalStatus) || undefined,
        anniversary_month: values.anniversary_month ? parseInt(values.anniversary_month) : undefined,
        anniversary_day: values.anniversary_day ? parseInt(values.anniversary_day) : undefined,
        birth_month: values.birth_month ? parseInt(values.birth_month) : undefined,
        birth_day: values.birth_day ? parseInt(values.birth_day) : undefined,
        service: values.service,
        notes: values.notes,
      };

      let visitor: Visitor;
      
      if (editVisitor) {
        visitor = await updateVisitor(editVisitor.id!, visitorData);
        toast.success('Visitor updated successfully!');
        form.reset();
        onSuccess();
        onOpenChange(false);
        return;
      } else {
        visitor = await createVisitor(visitorData);
      }
      
      // Trigger instant SMS if an 'instant' template exists
      try {
          const templates = await getTemplates();
          const instantTemplate = templates.find(t => t.trigger_type === 'instant');

          if (instantTemplate) {
              const churchName = "RCCG Victory Center"; 
              const message = instantTemplate.message
                  .replace(/{{name}}/g, values.name)
                  .replace(/{{church_name}}/g, churchName)
                  .replace(/{{service_attended}}/g, values.service || 'our');
              
              const result = await sendSms(values.phone, message);
              
              await createMessageLog({
                  visitor_id: visitor.id,
                  visitor_name: values.name,
                  phone: values.phone,
                  message,
                  status: result.success ? 'sent' : 'failed',
                  provider_response: 'results' in result ? result.results : undefined,
              });

              if (result.success) {
                  toast.success('Welcome SMS sent automatically!');
              } else {
                  toast.warning('Visitor saved, but welcome SMS failed.');
              }
          }

          // Queue delayed follow-ups
          const delayTemplates = templates.filter(t => t.trigger_type === 'delay' && t.delay_days);
          for (const t of delayTemplates) {
              const scheduledFor = new Date();
              scheduledFor.setDate(scheduledFor.getDate() + (t.delay_days || 0));
              
              await createQueuedMessage({
                  visitor_id: visitor.id!,
                  template_id: t.id!,
                  phone: values.phone,
                  message: t.message,
                  scheduled_for: scheduledFor.toISOString(),
                  status: 'pending',
              });
          }
      } catch (smsError) {
          console.error('SMS automation error:', smsError);
      }

      toast.success('Visitor added successfully!');
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding visitor:', error);
      toast.error('Failed to add visitor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editVisitor ? 'Edit Visitor' : 'Add New Visitor'}</DialogTitle>
          <DialogDescription>
            {editVisitor ? 'Update visitor details.' : 'Enter the details of the first-time visitor.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: ControllerRenderProps<FormValues, 'name'> }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }: { field: ControllerRenderProps<FormValues, 'phone'> }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="08012345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }: { field: ControllerRenderProps<FormValues, 'gender'> }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birth_month"
                render={({ field }: { field: ControllerRenderProps<FormValues, 'birth_month'> }) => (
                  <FormItem>
                    <FormLabel>Birth Month</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="max-h-50">
                        <SelectItem value="1">January</SelectItem>
                        <SelectItem value="2">February</SelectItem>
                        <SelectItem value="3">March</SelectItem>
                        <SelectItem value="4">April</SelectItem>
                        <SelectItem value="5">May</SelectItem>
                        <SelectItem value="6">June</SelectItem>
                        <SelectItem value="7">July</SelectItem>
                        <SelectItem value="8">August</SelectItem>
                        <SelectItem value="9">September</SelectItem>
                        <SelectItem value="10">October</SelectItem>
                        <SelectItem value="11">November</SelectItem>
                        <SelectItem value="12">December</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birth_day"
                render={({ field }: { field: ControllerRenderProps<FormValues, 'birth_day'> }) => (
                  <FormItem>
                    <FormLabel>Birth Day</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="max-h-50">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="marital_status"
                render={({ field }: { field: ControllerRenderProps<FormValues, 'marital_status'> }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch('marital_status') === 'married' && (
                <FormField
                  control={form.control}
                  name="anniversary_month"
                  render={({ field }: { field: ControllerRenderProps<FormValues, 'anniversary_month'> }) => (
                    <FormItem>
                      <FormLabel>Anniversary Month</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="max-h-50">
                          <SelectItem value="1">January</SelectItem>
                          <SelectItem value="2">February</SelectItem>
                          <SelectItem value="3">March</SelectItem>
                          <SelectItem value="4">April</SelectItem>
                          <SelectItem value="5">May</SelectItem>
                          <SelectItem value="6">June</SelectItem>
                          <SelectItem value="7">July</SelectItem>
                          <SelectItem value="8">August</SelectItem>
                          <SelectItem value="9">September</SelectItem>
                          <SelectItem value="10">October</SelectItem>
                          <SelectItem value="11">November</SelectItem>
                          <SelectItem value="12">December</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            {form.watch('marital_status') === 'married' && (
              <FormField
                control={form.control}
                name="anniversary_day"
                render={({ field }: { field: ControllerRenderProps<FormValues, 'anniversary_day'> }) => (
                  <FormItem>
                    <FormLabel>Anniversary Day</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="max-h-50">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="service"
              render={({ field }: { field: ControllerRenderProps<FormValues, 'service'> }) => (
                <FormItem>
                  <FormLabel>Service Attended</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>{service}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }: { field: ControllerRenderProps<FormValues, 'notes'> }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Love to be ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (editVisitor ? 'Updating...' : 'Adding...') : (editVisitor ? 'Update Visitor' : 'Save Visitor')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
