const http = require('http');
const data = JSON.stringify({
  email: "test@example.com",
  amount: 3120, // 3000 + 120 fee
  event_id: "0d8db0cf-9904-4b53-a5ff-b31a3169f417", // Need actual event ID for valid-early-bird
  ticket_type_name: "General Admission",
  quantity: 1,
  user_id: "test",
  guest_name: "test"
});

async function run() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: event } = await supabase.from('events').select('*').eq('slug', 'valid-early-bird').single();
  
  if(!event) return console.log("Event not found");

  // Need to figure out the exact payload that the frontend sends for early bird.
  // In TicketSelectionModal, what is totalAmount?
  // totalAmount = baseAmount + serviceFee
  // baseAmount = 3000
  // serviceFee = 3000 * 0.04 = 120
  // totalAmount = 3120

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/checkout/initialize',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify({...JSON.parse(data), event_id: event.id}))
    }
  };

  const req = http.request(options, res => {
    let responseBody = '';
    res.on('data', chunk => responseBody += chunk);
    res.on('end', () => console.log('Response:', responseBody));
  });

  req.write(JSON.stringify({...JSON.parse(data), event_id: event.id}));
  req.end();
}
run();
