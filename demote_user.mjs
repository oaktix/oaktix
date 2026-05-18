import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log("🔍 Searching for 'gahdejtheprice' in profiles...");
  
  // 1. Search in profiles table
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*');

  if (pError) {
    console.error("❌ Error fetching profiles:", pError.message);
    process.exit(1);
  }

  console.log(`📋 Total profiles found: ${profiles?.length || 0}`);
  
  // Try to find the user
  const searchTerm1 = 'gahdejtheprice';
  const searchTerm2 = 'gahdejtheprince';
  
  let targetUser = profiles?.find(p => 
    (p.full_name && (p.full_name.toLowerCase().includes(searchTerm1) || p.full_name.toLowerCase().includes(searchTerm2))) || 
    (p.id && (p.id.toLowerCase().includes(searchTerm1) || p.id.toLowerCase().includes(searchTerm2)))
  );

  // Also search auth users if we can
  console.log("🔍 Searching in auth users...");
  const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
  if (uError) {
    console.error("❌ Error listing auth users:", uError.message);
  } else {
    console.log(`📋 Total auth users found: ${users?.length || 0}`);
    const authUser = users?.find(u => 
      (u.email && (u.email.toLowerCase().includes(searchTerm1) || u.email.toLowerCase().includes(searchTerm2))) ||
      (u.user_metadata?.full_name && (u.user_metadata.full_name.toLowerCase().includes(searchTerm1) || u.user_metadata.full_name.toLowerCase().includes(searchTerm2))) ||
      (u.id && (u.id.toLowerCase() === searchTerm1 || u.id.toLowerCase() === searchTerm2))
    );
    if (authUser) {
      console.log(`🎯 Found matching auth user:`, {
        id: authUser.id,
        email: authUser.email,
        user_metadata: authUser.user_metadata
      });
      // If we didn't find the profile yet, or to be sure, let's use this user's ID
      if (!targetUser) {
        targetUser = profiles?.find(p => p.id === authUser.id) || { id: authUser.id };
      }
    }
  }

  if (!targetUser) {
    // If not found, let's look for any user whose email or metadata has it
    console.log("❌ No user matching 'gahdejtheprice' found in search. Listing all profiles and users to help find it...");
    console.log("Profiles:");
    profiles.forEach(p => console.log(`- ID: ${p.id}, FullName: ${p.full_name}, Role: ${p.role}`));
    if (users) {
      console.log("Auth Users:");
      users.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Metadata:`, u.user_metadata));
    }
    process.exit(1);
  }

  const userId = targetUser.id;
  console.log(`🎯 Found target user profile:`, targetUser);

  // 2. Demote the user in profiles table
  console.log(`🔄 Updating profiles table: set role = 'user' for ID: ${userId}...`);
  const { error: dbError } = await supabase
    .from('profiles')
    .update({ role: 'user' })
    .eq('id', userId);

  if (dbError) {
    console.error("❌ Failed to update profiles table:", dbError.message);
  } else {
    console.log("✅ Successfully updated profiles table to role = 'user'!");
  }

  // 3. Demote in auth.users metadata
  console.log(`🔄 Updating auth user metadata: set role = 'user' for ID: ${userId}...`);
  const { error: authMetaError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: "user" }
  });

  if (authMetaError) {
    console.error("❌ Failed to update auth metadata:", authMetaError.message);
  } else {
    console.log("✅ Successfully updated auth user_metadata to role = 'user'!");
  }

  console.log("🎉 User demoted successfully!");
}

main().catch(console.error);
