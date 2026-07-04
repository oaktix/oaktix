import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminSupabase = createClient(supabaseUrl, serviceKey);

  const testEmail = "test_vendor_team_" + Math.random().toString(36).substring(7) + "@example.com";
  const testPassword = "Password123!";

  console.log(`Creating test vendor user: ${testEmail}...`);
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { role: 'vendor', full_name: 'Test Vendor' }
  });

  if (authError) {
    console.error("Failed to create auth user:", authError);
    return;
  }

  const userId = authData.user.id;
  console.log(`Created user with ID: ${userId}`);

  // Update profile role (since trigger auto-inserts it)
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .update({
      role: 'vendor',
      full_name: 'Test Vendor'
    })
    .eq("id", userId);

  if (profileError) {
    console.error("Failed to update profile:", profileError);
    return;
  }

  // Create a test event
  const { data: eventData, error: eventError } = await adminSupabase
    .from("events")
    .insert({
      title: "Test Team Event",
      slug: "test-team-event-" + Math.random().toString(36).substring(7),
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 3600000).toISOString(),
      organizer_id: userId,
      status: "published"
    })
    .select("id")
    .single();

  if (eventError) {
    console.error("Failed to create event:", eventError);
    return;
  }

  console.log(`Created test event: ${eventData.id}`);

  // Create a client for the test user
  const userSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Sign in as test user
  const { data: sessionData, error: signInError } = await userSupabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (signInError) {
    console.error("Failed to sign in as user:", signInError);
    return;
  }

  console.log("Successfully signed in! Running team queries...");

  // Query 1: Fetch events
  const { data: eventsData, error: eventsQueryError } = await userSupabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", userId);

  console.log("Events query result:", { data: eventsData, error: eventsQueryError });

  if (eventsData && eventsData.length > 0) {
    const eventIds = eventsData.map(e => e.id);
    
    // Query 2: Fetch scanners
    const { data: scannersData, error: scannersQueryError } = await userSupabase
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
      `)
      .in("event_id", eventIds);

    console.log("Scanners query result:", { data: scannersData, error: scannersQueryError });
  }

  // Cleanup
  console.log("Cleaning up test data...");
  await adminSupabase.from("events").delete().eq("organizer_id", userId);
  await adminSupabase.from("profiles").delete().eq("id", userId);
  await adminSupabase.auth.admin.deleteUser(userId);
  console.log("Cleanup done!");
}

main().catch(console.error);
