const ACCOUNT_SID = 'AC51886bea5e4cf730238a4affad480463';
const AUTH_TOKEN = 'd587bcca5f24dc1dd7588c0cfe53b12d';
const FROM_NUMBER = '+16812918160';

async function testTwilioSMS(phone) {
  console.log('\n🔵 Testing Twilio SMS...');
  
  const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
  
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: phone,
      From: FROM_NUMBER,
      Body: 'Test SMS from Church Visitor Manager via Twilio'
    })
  });
  
  const data = await response.json();
  console.log('Twilio Response:', data);
  return data;
}

const testPhone = process.argv[2];
if (!testPhone) {
  console.log('Usage: node test-twilio.js +2349063442038');
  process.exit(1);
}

let phone = testPhone.trim();
if (phone.startsWith('0')) {
  phone = '+234' + phone.slice(1);
} else if (!phone.startsWith('+')) {
  phone = '+' + phone;
}

console.log('Testing Twilio with phone:', phone);
testTwilioSMS(phone);
