import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, fullName } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and Full Name are required" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Try to list users to find if one with this email already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Admin list users error:", listError);
      throw listError;
    }

    let user = existingUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "user"
        }
      });

      if (createError) {
        console.error("Admin create user error:", createError);
        throw createError;
      }

      user = newUser.user;
    }

    // 2. Double check if profile exists, if not, create it
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        await supabaseAdmin.from("profiles").insert({
          id: user.id,
          full_name: fullName,
          email: email, // If email column exists
          role: "user"
        });
      }
    }

    return NextResponse.json({ user: { id: user?.id, email: user?.email } });
  } catch (err: unknown) {
    console.error("Guest checkout API error:", err);
    return NextResponse.json({ error: (err as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
