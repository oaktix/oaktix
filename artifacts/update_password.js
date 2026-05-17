const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase env vars in .env.local!");
    process.exit(1);
  }

  // Check if Service Role Key is equal to Anon Key
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (serviceRoleKey === anonKey) {
    console.error("\n❌ ERROR: Your SUPABASE_SERVICE_ROLE_KEY in .env.local is currently set to your ANON KEY!");
    console.error("Please retrieve the secret service_role key from your Supabase Dashboard (Settings -> API) and paste it into .env.local, then run this script again!\n");
    process.exit(1);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const email = "gahdejtheprince@gmail.com";
  const newPassword = "Admin123Password!";
  const fullName = "Gahdej The Prince";

  console.log(`\nConnecting as Supabase Admin to manage account: ${email}...`);

  // 1. Try to list users to find the exact user ID
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error("❌ Failed to list users:", listError.message);
    return;
  }

  const user = usersData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.log(`User ${email} does not exist in Auth. Creating a new admin user...`);
    // Create new admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: newPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "admin"
      }
    });

    if (createError) {
      console.error("❌ Failed to create user:", createError.message);
      return;
    }

    console.log("✅ Admin user created successfully in Auth!");
    const userId = newUser.user.id;

    // Insert profile database record
    const { error: dbError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        full_name: fullName,
        role: "admin"
      });

    if (dbError) {
      console.error("⚠️ Failed to create profile record:", dbError.message);
    } else {
      console.log("✅ Database profile record created successfully as admin!");
    }
  } else {
    console.log(`Found existing user with ID: ${user.id}. Upgrading role and resetting password...`);

    // 2. Reset password and confirm email using Admin API
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "admin"
        }
      }
    );

    if (updateError) {
      console.error("❌ Failed to update auth account details:", updateError.message);
      return;
    }

    console.log("✅ Auth account details & password updated successfully!");

    // 3. Upsert database profile record to make sure it's admin
    const { error: dbError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        role: "admin"
      });

    if (dbError) {
      console.error("⚠️ Database profile update failed:", dbError.message);
    } else {
      console.log("✅ Database profile upgraded successfully to admin!");
    }
  }

  console.log("\n🎉 SUCCESS!");
  console.log(`You can now log in using:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${newPassword}`);
  console.log("This account has full admin permissions.\n");
}

main();
