const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: tickets } = await supabase.from('tickets').select('*').limit(1);
  console.log(JSON.stringify(tickets, null, 2));
}
run();
