// Meta WhatsApp Cloud API Integration
const META_API_URL = 'https://graph.facebook.com/v18.0';

export const sendWhatsApp = async (phone: string, message: string) => {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { success: false, message: 'Meta credentials missing' };
  }

  // Format phone (remove + and spaces)
  let formattedPhone = phone.replace(/[\s+]/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '234' + formattedPhone.slice(1);
  }

  try {
    const response = await fetch(`${META_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.messages?.[0]?.id) {
      return { success: true, data };
    } else {
      console.error('Meta WhatsApp Error:', data);
      return { success: false, data };
    }
  } catch (error) {
    console.error('WhatsApp Send Error:', error);
    return { success: false, message: 'Fetch error' };
  }
};
