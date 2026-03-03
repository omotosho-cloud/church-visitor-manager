const API_KEY = 'TLzYSCqFJjdgVJGqykHrqYogeSMVCpAPyaVKOWybLngJxCUleRdQDalIXZzlTm';

(async () => {
  console.log('Checking Termii Balance...\n');
  const response = await fetch(`https://v3.api.termii.com/api/get-balance?api_key=${API_KEY}`);
  const data = await response.json();
  console.log('Balance:', data);
})();
