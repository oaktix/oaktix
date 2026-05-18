import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use service role key — MUST be the real service_role key, not the anon key
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
  }

  const email = "hello@oaktix.com.ng";
  const password = "OakTixSuperAdmin2026!";
  const fullName = "OakTix Super Admin";

  // ------------------------------------------------------------------
  // STEP 1: Find the user's ID by signing in with their credentials
  // ------------------------------------------------------------------
  console.log("\n🔑 Step 1: Signing in to get user ID...");
  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({ email, password });

  if (loginError || !loginData?.user) {
    console.error("❌ Login failed:", loginError?.message || "No user returned");
    console.log("   → Make sure the account exists and the password is correct.");
    process.exit(1);
  }

  const userId = loginData.user.id;
  console.log(`✅ Signed in. User ID: ${userId}`);

  // ------------------------------------------------------------------
  // STEP 2: Check if we have a real service role key
  // ------------------------------------------------------------------
  const hasServiceKey = serviceKey && serviceKey !== anonKey && serviceKey.length > 100;

  if (!hasServiceKey) {
    console.log("\n⚠️  No distinct SUPABASE_SERVICE_ROLE_KEY found in .env.local.");
    console.log("   The user_metadata.role will be updated using the user's own session.");
    console.log("   The profiles table update requires RLS to allow it (may fail).\n");
  }

  // ------------------------------------------------------------------
  // STEP 3: Update user_metadata via the user's own session (always works)
  // ------------------------------------------------------------------
  console.log("🔑 Step 2: Updating auth user_metadata.role = 'super_admin'...");
  const { error: metaError } = await anonClient.auth.updateUser({
    data: { role: "super_admin", full_name: fullName }
  });

  if (metaError) {
    console.error("❌ Metadata update failed:", metaError.message);
  } else {
    console.log("✅ Auth user_metadata updated to super_admin!");
  }

  // ------------------------------------------------------------------
  // STEP 4: Update the profiles table
  // ------------------------------------------------------------------
  console.log("\n🗄️  Step 3: Updating profiles table...");

  if (hasServiceKey) {
    // Use service role key to bypass RLS
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { error: dbError } = await adminClient
      .from("profiles")
      .upsert({ id: userId, full_name: fullName, role: "super_admin" }, { onConflict: "id" });

    if (dbError) {
      console.error("❌ Service-role profiles update failed:", dbError.message);
    } else {
      console.log("✅ Profiles table updated to super_admin via service role!");
    }

    // Also update auth admin metadata (most reliable way)
    const { error: adminMetaError } = await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: { role: "super_admin", full_name: fullName }
    });
    if (adminMetaError) {
      console.error("❌ Admin metadata update failed:", adminMetaError.message);
    } else {
      console.log("✅ Auth admin metadata confirmed as super_admin!");
    }

  } else {
    // Attempt with anon session (will succeed only if RLS allows self-update)
    const { error: dbError } = await anonClient
      .from("profiles")
      .update({ full_name: fullName, role: "super_admin" })
      .eq("id", userId);

    if (dbError) {
      console.error("❌ Profiles DB update failed (RLS likely blocking):", dbError.message);
      console.log("\n📋 ACTION REQUIRED — Run this SQL in your Supabase SQL Editor:");
      console.log("──────────────────────────────────────────────────────────────");
      console.log(`UPDATE public.profiles SET role = 'super_admin', full_name = '${fullName}' WHERE id = '${userId}';`);
      console.log("──────────────────────────────────────────────────────────────\n");
    } else {
      console.log("✅ Profiles table updated to super_admin!");
    }
  }

  // ------------------------------------------------------------------
  // STEP 5: Verify
  // ------------------------------------------------------------------
  console.log("\n🔍 Step 4: Verifying final state...");
  const { data: { user: verifiedUser } } = await anonClient.auth.getUser();
  const metaRoleAfter = verifiedUser?.user_metadata?.role;
  console.log(`   → user_metadata.role = "${metaRoleAfter}"`);

  if (metaRoleAfter === "super_admin") {
    console.log("\n🎉 SUCCESS! The account is correctly configured as super_admin.");
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log("   Visit /admin to log in to the Super Admin dashboard.\n");
  } else {
    console.log("\n⚠️  user_metadata.role is not yet 'super_admin'.");
    console.log("   You may need to sign out and sign back in for the JWT to refresh.");
    console.log("   If the profiles DB update also failed, run the SQL above manually.\n");
  }
}

main().catch(console.error);
