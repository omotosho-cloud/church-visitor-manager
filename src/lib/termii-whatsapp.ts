const TERMII_WHATSAPP_URL = 'https://v3.api.termii.com/api/send/whatsapp';

export const sendWhatsApp = async (phone: string, message: string) => {
  const apiKey = process.env.TERMII_API_KEY;

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

  try {
    const response = await fetch(TERMII_WHATSAPP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        to: formattedPhone,
        type: 'plain',
        body: message,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.message_id) {
      return { success: true, data };
    } else {
      console.error('Termii WhatsApp Error:', data);
      return { success: false, data };
    }
  } catch (error) {
    console.error('WhatsApp Send Error:', error);
    return { success: false, message: 'Fetch error' };
  }
};
