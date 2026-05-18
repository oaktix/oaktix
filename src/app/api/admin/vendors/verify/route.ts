import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Authorize administrative session
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Active session required." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const userRole = profile?.role || user.user_metadata?.role;
    if (userRole !== "admin" && userRole !== "super_admin") {
      return NextResponse.json({ error: "Access Denied: Administrative privileges required." }, { status: 403 });
    }

    const { vendorId, verified } = await req.json();
    if (!vendorId) {
      return NextResponse.json({ error: "Vendor ID parameters are required." }, { status: 400 });
    }

    // 2. Load and bypass RLS with service_role to update profile metadata
    const supabaseAdmin = createAdminSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch existing vendor_details first to merge
    const { data: vendorProfile, error: getErr } = await supabaseAdmin
      .from("profiles")
      .select("vendor_details")
      .eq("id", vendorId)
      .single();

    if (getErr || !vendorProfile) {
      return NextResponse.json({ error: "Vendor profile not found or could not be queried." }, { status: 404 });
    }

    const updatedDetails = {
      ...(vendorProfile.vendor_details || {}),
      verified: !!verified,
    };

    // Update profiles table
    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ vendor_details: updatedDetails })
      .eq("id", vendorId);

    if (updateErr) {
      console.error("Admin vendor verification database error:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Update auth user metadata so the JWT matches as well
    await supabaseAdmin.auth.admin.updateUserById(vendorId, {
      user_metadata: { verified: !!verified }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server action crashed.";
    console.error("Admin verification routine crashed:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
