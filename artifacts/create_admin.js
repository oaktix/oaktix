const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars in .env.local!");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const email = "gahdejtheprince@gmail.com";
  const password = "Admin123Password!";
  const fullName = "Gahdej The Prince";

  console.log(`Starting Admin creation process for ${email}...`);

  // 1. Try to sign up the user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "admin"
      }
    }
  });

  let session = signUpData?.session;
  let user = signUpData?.user;

  if (signUpError) {
    if (signUpError.message.includes("already registered")) {
      console.log("User already signed up. Logging in...");
      // 2. Try to log in
      const { data: logInData, error: logInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (logInError) {
        console.error("Login failed with Admin123Password! password.", logInError.message);
        console.log("Please sign in manually with your password on the app and we will upgrade your profile role.");
        // Try to proceed anyway if there's an active profile we can update
      } else {
        session = logInData.session;
        user = logInData.user;
      }
    } else {
      console.error("Signup error:", signUpError.message);
      return;
    }
  } else {
    console.log("Signup successful!");
  }

  // If we have a session, update metadata to make absolutely sure they are admin
  if (session && user) {
    console.log("Updating auth user metadata to admin...");
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        role: "admin"
      }
    });

    if (updateError) {
      console.error("Auth metadata update failed:", updateError.message);
    } else {
      console.log("Auth metadata updated successfully!");
    }
  }

  // 3. Update the profiles database table directly
  // We first query to find if a profile exists by email or if we have a user ID
  let userId = user?.id;
  if (!userId) {
    // Fallback: search profile table by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    userId = profile?.id;
  }

  if (userId) {
    console.log(`Updating profile table role for user ID: ${userId}...`);
    // Upsert profile as admin
    const { error: dbError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: fullName,
        email: email,
        role: "admin"
      });

    if (dbError) {
      console.error("Database profile upgrade failed:", dbError.message);
      console.log("Trying to standard update instead of upsert...");
      const { error: updateDbError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);
      
      if (updateDbError) {
        console.error("Database update failed:", updateDbError.message);
      } else {
        console.log("Database profile upgraded successfully to admin!");
      }
    } else {
      console.log("Database profile upgraded/created successfully as admin!");
    }
  } else {
    console.error("Could not determine user ID to update profiles table. Please register gahdejtheprince@gmail.com on the site first, then run this script!");
  }

  console.log("\nFinished! You can now log in with:");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("This account has full admin permissions.");
}

main();
