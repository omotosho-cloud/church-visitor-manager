import * as termii from './termii';
import * as twilio from './twilio';
import * as twilioWhatsApp from './twilio-whatsapp';
import * as termiiWhatsApp from './termii-whatsapp';
import { getSettings } from './db';

export type SmsProvider = 'termii' | 'twilio';
export type WhatsAppProvider = 'twilio-whatsapp' | 'termii-whatsapp';
export type MessageChannel = 'sms' | 'whatsapp' | 'both';

export interface SmsSettings {
  provider?: SmsProvider;
  sms_provider?: SmsProvider;
  whatsapp_provider?: WhatsAppProvider;
  message_channel?: MessageChannel;
  sender_id?: string;
  automation_enabled?: boolean;
}

export const sendSms = async (phone: string, message: string) => {
  try {
    const settings = await getSettings();
    
    const channel = settings.message_channel || 'sms';
    const results = [];

    // Send SMS
    if (channel === 'sms' || channel === 'both') {
      const provider = settings.sms_provider || 'termii';
      const smsResult = provider === 'twilio' 
        ? await twilio.sendSms(phone, message)
        : await termii.sendSms(phone, message);
      results.push({ channel: 'sms', ...smsResult });
    }

    // Send WhatsApp
    if (channel === 'whatsapp' || channel === 'both') {
      const whatsappProvider = settings.whatsapp_provider || 'twilio-whatsapp';
      const whatsappResult = whatsappProvider === 'termii-whatsapp'
        ? await termiiWhatsApp.sendWhatsApp(phone, message)
        : await twilioWhatsApp.sendWhatsApp(phone, message);
      results.push({ channel: 'whatsapp', ...whatsappResult });
    }

    // Return success if at least one channel succeeded
    const anySuccess = results.some(r => r.success);
    return { 
      success: anySuccess, 
      results,
      message: anySuccess ? 'Message sent' : 'All channels failed'
    };
  } catch (error) {
    console.error('Messaging Service Error:', error);
    return { success: false, message: 'Service error' };
  }
};
