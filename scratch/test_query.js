import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, serviceKey);

  console.log("Testing query on scanners with service role...");
  const { data, error } = await supabase
    .from("scanners")
    .select(`
      id,
      staff_id,
      event_id,
      profiles:staff_id (
        full_name,
        email
      ),
      events:event_id (
        title
      )
    `);

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log("Query succeeded! Result length:", data?.length);
    console.log("Sample row:", data?.[0]);
  }
}

main().catch(console.error);
