export type TriggerType = 'instant' | 'delay' | 'scheduled';
export type MessageStatus = 'pending' | 'sent' | 'failed';
export type AdminRole = 'admin';
export type AuthProvider = 'google' | 'email';

export interface Visitor {
  id?: string;
  name: string;
  phone: string;
  gender: string;
  service?: string;
  notes?: string;
  created_at?: string;
}

export interface Template {
  id?: string;
  name: string;
  message: string;
  trigger_type: TriggerType;
  delay_days?: number;
  created_at?: string;
}

export interface MessageQueueItem {
  id?: string;
  visitor_id: string;
  visitor_name?: string;
  template_id: string;
  phone: string;
  message: string;
  scheduled_for: string;
  status: MessageStatus;
  created_at?: string;
}

export interface SmsLog {
  id?: string;
  visitor_id?: string;
  visitor_name?: string;
  phone: string;
  message: string;
  status: string;
  provider?: string;
  provider_response?: unknown;
  sent_at?: string;
}

export interface Admin {
  id?: string;
  name: string;
  email: string;
  role: AdminRole;
  provider: AuthProvider;
}

export interface Settings {
  church_name: string;
  logo?: string;
  theme_color: string;
  sender_id: string;
  automation_enabled: boolean;
  sms_provider?: 'termii' | 'twilio';
  whatsapp_provider?: 'twilio-whatsapp' | 'termii-whatsapp';
  message_channel?: 'sms' | 'whatsapp' | 'both';
}
