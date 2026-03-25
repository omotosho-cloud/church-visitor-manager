export interface TwilioSmsPayload {
  to: string;
  body: string;
  from: string;
}

export const sendSms = async (phone: string, message: string) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio credentials missing');
    return { success: false, message: 'Twilio credentials missing' };
  }

  // Format phone number with + prefix
  let formattedPhone = phone.trim().replace(/\s+/g, '');
  
  // Remove existing + if present
  if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.slice(1);
  }
  
  // Convert 0 prefix to 234
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '234' + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith('234')) {
    formattedPhone = '234' + formattedPhone;
  }
  
  // Validate length
  if (formattedPhone.length !== 13 || !/^\d+$/.test(formattedPhone)) {
    console.error('Invalid phone format:', phone);
    return { success: false, message: 'Invalid phone number format' };
  }
  
  // Add + prefix for Twilio
  formattedPhone = '+' + formattedPhone;

  console.log('Sending SMS via Twilio to:', formattedPhone);

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
          To: formattedPhone,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      console.error('Twilio Error:', data);
      return { success: false, data };
    }
  } catch (error) {
    console.error('SMS Send Error:', error);
    return { success: false, message: 'Fetch error' };
  }
};
