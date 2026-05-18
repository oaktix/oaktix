import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Checking if system_configurations table exists...");
  const { data, error } = await supabase
    .from("system_configurations")
    .select("*")
    .limit(1);

  if (error) {
    console.log("Error querying system_configurations table:", error.message);
  } else {
    console.log("Table exists! Content:", data);
  }
}

main();
