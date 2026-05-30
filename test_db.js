const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: event } = await supabase.from('events').select('slug, title, ticket_types').eq('slug', 'new-test').single();
  const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', event.id);
  console.log(`Event: ${event.title}`);
  console.log(`Tickets sold: ${count}`);
  console.log(`Early Bird Config:`, event.ticket_types[0].early_bird_price, event.ticket_types[0].early_bird_capacity, event.ticket_types[0].early_bird_until);
}
run();
