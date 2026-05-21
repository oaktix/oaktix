import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    // 2. Validate super_admin role in DB
    const { data: profile, error: dbError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (dbError || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden. Super Admin privileges required." }, { status: 403 });
    }

    // 3. Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY!);
    
    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get("id");
    const type = searchParams.get("type") || "sent"; // 'sent' or 'received'
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const after = searchParams.get("after") || undefined;

    // 5. Fetch single email detail if ID is provided
    if (emailId) {
      if (type === "received") {
        const detail = await resend.emails.receiving.get(emailId);
        if (detail.error) {
          return NextResponse.json({ error: detail.error.message }, { status: 400 });
        }
        return NextResponse.json({ data: detail.data });
      } else {
        const detail = await resend.emails.get(emailId);
        if (detail.error) {
          return NextResponse.json({ error: detail.error.message }, { status: 400 });
        }
        return NextResponse.json({ data: detail.data });
      }
    }

    // 6. Fetch lists
    if (type === "received") {
      const list = await resend.emails.receiving.list({ limit, after });
      if (list.error) {
        return NextResponse.json({ error: list.error.message }, { status: 400 });
      }
      return NextResponse.json({ data: list.data });
    } else {
      const list = await resend.emails.list({ limit, after });
      if (list.error) {
        return NextResponse.json({ error: list.error.message }, { status: 400 });
      }
      return NextResponse.json({ data: list.data });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Resend admin API handler crashed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
