'use client';

import { useEffect, useRef } from 'react';
import { getQueuedMessages, updateQueuedMessage, getVisitor, getTemplate, createMessageLog } from '@/lib/db';
import { MessageQueueItem } from '@/lib/types';
import { sendSms } from '@/lib/sms';

export function useFollowUpProcessor() {
  const processingRef = useRef(false);

  const processQueue = async () => {
    if (processingRef.current) return;
    
    try {
      processingRef.current = true;
      const now = new Date();
      
      // Fetch pending messages that are due
      const items = await getQueuedMessages();
      
      for (const item of items) {
        if (new Date(item.scheduled_for) <= now) {
          await processItem(item);
        }
      }
    } catch (error) {
      console.error('Queue processor error:', error);
    } finally {
      processingRef.current = false;
    }
  };

  const processItem = async (item: MessageQueueItem) => {
    try {
      // Fetch visitor and template
      const visitor = await getVisitor(item.visitor_id);
      const template = await getTemplate(item.template_id);
      
      const churchName = "RCCG Victory Center";
      const message = template.message
          .replace(/{{name}}/g, visitor.name)
          .replace(/{{church_name}}/g, churchName)
          .replace(/{{service_attended}}/g, visitor.service || 'our');

      const result = await sendSms(visitor.phone, message);
      
      // Update item status
      await updateQueuedMessage(item.id!, {
        status: result.success ? 'sent' : 'failed',
      });

      // Log the SMS
      await createMessageLog({
        visitor_id: visitor.id,
        visitor_name: visitor.name,
        phone: visitor.phone,
        message,
        status: result.success ? 'sent' : 'failed',
        provider_response: 'results' in result ? result.results : undefined,
      });

    } catch (error) {
      console.error('Failed to process queue item:', error);
      try {
        await updateQueuedMessage(item.id!, { status: 'failed' });
      } catch (e) {
        console.error('Failed to update queue item status:', e);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(processQueue, 1000 * 60); // Check every minute
    processQueue(); // Initial check
    return () => clearInterval(interval);
  }, []);
}
