export const sendWhatsApp = async (phone: string, message: string) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox default

  if (!accountSid || !authToken) {
    console.error('Twilio credentials missing');
    return { success: false, message: 'Twilio credentials missing' };
  }

  // Format phone number for WhatsApp
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '234' + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith('234') && !formattedPhone.startsWith('+')) {
    formattedPhone = '234' + formattedPhone;
  }
  
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+' + formattedPhone;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
        },
        body: new URLSearchParams({
          To: `whatsapp:${formattedPhone}`,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      console.error('Twilio WhatsApp Error:', data);
      return { success: false, data };
    }
  } catch (error) {
    console.error('WhatsApp Send Error:', error);
    return { success: false, message: 'Fetch error' };
  }
};
