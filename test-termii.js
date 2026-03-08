const API_KEY = 'TLhmZjIBpIpoMcPJwhaUwwhmFQWrdjDuVlrIqRobdTIYpZGJXvsRlFtARNexPD';
const SENDER_ID = 'VICTORYCNTR'; // Your registered sender ID
const GENERIC_SENDER = 'N-Alert'; // Generic fallback

// Check balance
async function checkBalance() {
  console.log('\n💰 Checking Balance...');
  const response = await fetch(`https://v3.api.termii.com/api/get-balance?api_key=${API_KEY}`);
  const data = await response.json();
  console.log('Balance:', data);
  return data;
}

// Test SMS with custom sender
async function testSMS(phone) {
  console.log('\n🔵 Testing SMS with VICTORYCNTR (generic channel)...');
  const response = await fetch('https://v3.api.termii.com/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: phone,
      from: SENDER_ID,
      sms: 'Hi ayobami obaloluwa, welcome to victory centre! We are glad you joined our Sunday service.',
      type: 'plain',
      channel: 'generic',
      api_key: API_KEY,
    }),
  });
  const data = await response.json();
  console.log('SMS Response:', data);
  return data;
}

// Test SMS with generic sender
async function testGenericSMS(phone) {
  console.log('\n🔵 Testing SMS with Generic Sender...');
  const response = await fetch('https://v3.api.termii.com/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: phone,
      from: GENERIC_SENDER,
      sms: 'Hi ayobami obaloluwa, welcome to victory centre! We are glad you joined our Sunday service.',
      type: 'plain',
      channel: 'generic',
      api_key: API_KEY,
    }),
  });
  const data = await response.json();
  console.log('Generic SMS Response:', data);
  return data;
}

// Test WhatsApp
async function testWhatsApp(phone) {
  console.log('\n🟢 Testing WhatsApp...');
  const response = await fetch('https://v3.api.termii.com/api/send/template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: API_KEY,
      phone_number: phone,
      device_id: 'YOUR_DEVICE_ID',
      template_id: 'YOUR_TEMPLATE_ID',
      data: {
        product_name: 'Church',
        otp: '1234',
        expiry_time: '10 minutes'
      }
    }),
  });
  const data = await response.json();
  console.log('WhatsApp Response:', data);
  return data;
}

// Run tests
const testPhone = process.argv[2];
if (!testPhone) {
  console.log('Usage: node test-termii.js 08012345678');
  process.exit(1);
}

// Format phone
let phone = testPhone.trim();
if (phone.startsWith('0')) {
  phone = '234' + phone.slice(1);
} else if (!phone.startsWith('234')) {
  phone = '234' + phone;
}

console.log('Testing with phone:', phone);
console.log('API Key:', API_KEY?.slice(0, 10) + '...');
console.log('Sender ID:', SENDER_ID);

(async () => {
  await checkBalance();
  await testSMS(phone);
  // await testGenericSMS(phone);
  // await testWhatsApp(phone);
})();
