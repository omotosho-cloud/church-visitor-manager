// Termii WhatsApp uses template-based messaging
// Note: You need to create and approve templates in your Termii dashboard first
const TERMII_WHATSAPP_URL = 'https://api.ng.termii.com/api/send/template';

export const sendWhatsApp = async (phone: string, message: string) => {
  const apiKey = process.env.TERMII_API_KEY;
  const deviceId = process.env.TERMII_DEVICE_ID; // Required for WhatsApp
  const templateId = process.env.TERMII_WHATSAPP_TEMPLATE_ID; // Your approved template ID

  if (!apiKey) {
    console.error('Termii API Key is missing');
    return { success: false, message: 'API Key missing' };
  }

  if (!deviceId || !templateId) {
    console.error('Termii WhatsApp requires TERMII_DEVICE_ID and TERMII_WHATSAPP_TEMPLATE_ID');
    return { success: false, message: 'WhatsApp configuration incomplete' };
  }

  // Format phone number with country code
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '234' + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith('234') && !formattedPhone.startsWith('+')) {
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
        phone_number: formattedPhone,
        device_id: deviceId,
        template_id: templateId,
        data: {
          product_name: 'Church Visitor Manager',
          message: message,
        },
      }),
    });

    const data = await response.json();
    
    if (response.ok && (data.code === 'ok' || data.message === 'Successfully Sent')) {
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
