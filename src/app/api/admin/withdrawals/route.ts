import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendWithdrawalStatusEmail } from "@/lib/email";

// GET: list withdrawals, optional status filter
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  // Authorize admin
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role || user.user_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Use service role to bypass RLS
  const admin = createAdminSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const query = admin.from("withdrawals").select("id, vendor_id, amount, requested_at, status, processed_at");
  if (status) query.eq("status", status);
  const { data, error } = await query.order("requested_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ withdrawals: data });
}

// POST: approve or reject a withdrawal
export async function POST(request: Request) {
  const { id, action } = await request.json(); // action: "approve" | "reject"
  if (!id || !action) {
    return NextResponse.json({ error: "Missing id or action" }, { status: 400 });
  }

  // Authorize admin (same as GET)
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role || user.user_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const admin = createAdminSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const newStatus = action === "approve" ? "approved" : "rejected";
  const { error } = await admin
    .from("withdrawals")
    .update({ status: newStatus, processed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch withdrawal details for email
  const { data: wd } = await admin
    .from("withdrawals")
    .select("vendor_id, amount")
    .eq("id", id)
    .single();

  // Fetch vendor email
  const { data: vendorProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", wd.vendor_id)
    .single();

  if (vendorProfile?.email) {
    await sendWithdrawalStatusEmail(vendorProfile.email, wd.amount, newStatus as any);
  }

  return NextResponse.json({ success: true, status: newStatus });
}
