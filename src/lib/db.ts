import { supabase } from './supabase';
import { Visitor, Template, MessageQueueItem, SmsLog, Settings, Member } from './types';

// Visitors
export const getVisitors = async () => {
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Visitor[];
};

export const getVisitor = async (id: string) => {
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Visitor;
};

export const createVisitor = async (visitor: Omit<Visitor, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('visitors')
    .insert(visitor)
    .select()
    .single();
  if (error) throw error;
  return data as Visitor;
};

export const updateVisitor = async (id: string, visitor: Partial<Visitor>) => {
  const { data, error } = await supabase
    .from('visitors')
    .update(visitor)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Visitor;
};

export const deleteVisitor = async (id: string) => {
  const { error } = await supabase
    .from('visitors')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Templates
export const getTemplates = async () => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Template[];
};

export const getTemplate = async (id: string) => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Template;
};

export const createTemplate = async (template: Omit<Template, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('templates')
    .insert(template)
    .select()
    .single();
  if (error) throw error;
  return data as Template;
};

export const updateTemplate = async (id: string, template: Partial<Template>) => {
  const { data, error } = await supabase
    .from('templates')
    .update(template)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Template;
};

export const deleteTemplate = async (id: string) => {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Message Logs
export const getMessageLogs = async () => {
  const { data, error } = await supabase
    .from('message_logs')
    .select('*')
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return data as SmsLog[];
};

export const createMessageLog = async (log: Omit<SmsLog, 'id' | 'sent_at'>) => {
  const { data, error } = await supabase
    .from('message_logs')
    .insert(log)
    .select()
    .single();
  if (error) throw error;
  return data as SmsLog;
};

// Message Queue
export const getQueuedMessages = async () => {
  const { data, error } = await supabase
    .from('message_queue')
    .select('*, visitors(name)')
    .eq('status', 'pending')
    .order('scheduled_for', { ascending: true });
  if (error) throw error;
  return data.map(item => ({
    ...item,
    visitor_name: item.visitors?.name
  })) as MessageQueueItem[];
};

export const createQueuedMessage = async (item: Omit<MessageQueueItem, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('message_queue')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data as MessageQueueItem;
};

export const updateQueuedMessage = async (id: string, updates: Partial<MessageQueueItem>) => {
  const { data, error } = await supabase
    .from('message_queue')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MessageQueueItem;
};

export const deleteQueuedMessage = async (id: string) => {
  const { error } = await supabase
    .from('message_queue')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Settings
export const getSettings = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single();
  if (error) throw error;
  return data as Settings & { id: string };
};

export const updateSettings = async (settings: Partial<Settings>) => {
  const current = await getSettings();
  const { data, error } = await supabase
    .from('settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', current.id)
    .select()
    .single();
  if (error) throw error;
  return data as Settings;
};

// Services
export const getServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('name')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(s => s.name);
};

export const createService = async (name: string) => {
  const { data, error } = await supabase
    .from('services')
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteService = async (name: string) => {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('name', name);
  if (error) throw error;
};

// File Upload (using Supabase Storage)
export const uploadFile = async (file: File) => {
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('logos')
    .upload(fileName, file);
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('logos')
    .getPublicUrl(fileName);
  
  return { url: publicUrl };
};

// Members
export const getMembers = async () => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Member[];
};

export const getMember = async (id: string) => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Member;
};

export const createMember = async (member: Omit<Member, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('members')
    .insert(member)
    .select()
    .single();
  if (error) throw error;
  return data as Member;
};

export const updateMember = async (id: string, member: Partial<Member>) => {
  const { data, error } = await supabase
    .from('members')
    .update(member)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Member;
};

export const deleteMember = async (id: string) => {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const promoteVisitorToMember = async (visitorId: string, additionalData: Partial<Member>) => {
  const visitor = await getVisitor(visitorId);
  
  const memberData: Omit<Member, 'id' | 'created_at'> = {
    name: visitor.name,
    phone: visitor.phone,
    gender: visitor.gender,
    birth_month: visitor.birth_month,
    birth_day: visitor.birth_day,
    membership_status: 'active',
    category: 'adult',
    join_date: new Date().toISOString().split('T')[0],
    ...additionalData,
  };
  
  const member = await createMember(memberData);
  
  // Remove from visitors after successful promotion
  await deleteVisitor(visitorId);
  
  return member;
};

export const getUpcomingBirthdays = async (days: number = 7) => {
  const members = await getMembers();
  const today = new Date();
  const upcoming: Member[] = [];

  for (const member of members) {
    if (!member.birth_month || !member.birth_day) continue;

    const thisYear = today.getFullYear();
    const birthday = new Date(thisYear, member.birth_month - 1, member.birth_day);
    
    if (birthday < today) {
      birthday.setFullYear(thisYear + 1);
    }

    const daysUntil = Math.ceil((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil >= 0 && daysUntil <= days) {
      upcoming.push(member);
    }
  }

  return upcoming.sort((a, b) => {
    const aDate = new Date(today.getFullYear(), a.birth_month! - 1, a.birth_day!);
    const bDate = new Date(today.getFullYear(), b.birth_month! - 1, b.birth_day!);
    return aDate.getTime() - bDate.getTime();
  });
};
