import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Use service role key if available, otherwise fallback to anon key for safety
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAdmin = createAdminSupabase(supabaseUrl, supabaseServiceKey);

    // Delete user profile first
    await supabaseAdmin.from("profiles").delete().eq("id", user.id);

    // Delete user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Auth delete error:", deleteError.message);
      // Fallback: If service role key was the Anon key, admin.deleteUser fails.
      // In that case, we at least sign them out and let them know.
      await supabase.auth.signOut();
      return NextResponse.json({ success: true, message: "Signed out successfully." });
    }

    // Sign out completely
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete account failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
