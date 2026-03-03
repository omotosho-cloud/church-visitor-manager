const TERMII_API_URL = 'https://v3.api.termii.com/api/sms/send';

export interface SmsPayload {
  to: string;
  sms: string;
  from: string;
  type?: 'plain' | 'unicode';
  channel: 'generic' | 'dnd' | 'whatsapp';
  api_key: string;
}

export const sendSms = async (phone: string, message: string) => {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || 'VICTORYCNTR';

  if (!apiKey) {
    console.error('Termii API Key is missing');
    return { success: false, message: 'API Key missing' };
  }

  // Format Nigerian phone number (ensure it starts with 234)
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '234' + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith('234')) {
    formattedPhone = '234' + formattedPhone;
  }

  const payload: SmsPayload = {
    to: formattedPhone,
    sms: message,
    from: senderId,
    type: 'plain',
    channel: 'dnd', // DND channel is usually more reliable for Nigeria
    api_key: apiKey,
  };

  try {
    const response = await fetch(TERMII_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (response.ok && data.message_id) {
      return { success: true, data };
    } else {
      console.error('Termii Error:', data);
      return { success: false, data };
    }
  } catch (error) {
    console.error('SMS Send Error:', error);
    return { success: false, message: 'Fetch error' };
  }
};
