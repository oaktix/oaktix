import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendKYCApprovedEmail, sendKYCRejectedEmail } from "@/lib/email";

async function authorizeAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, allowed: false, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role || user.user_metadata?.role;
  const allowed = role === "admin" || role === "super_admin";
  return { user, allowed, supabase };
}

// Extracts the storage path from either a legacy public URL or a plain path
function extractStoragePath(documentUrl: string): string {
  const marker = '/object/public/kyc-documents/';
  const idx = documentUrl.indexOf(marker);
  if (idx !== -1) return documentUrl.slice(idx + marker.length);
  // Already a plain storage path (new format)
  return documentUrl;
}

// GET: list organizers with pending KYC
export async function GET() {
  const { user, allowed } = await authorizeAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, email, vendor_details, created_at")
    .eq("role", "vendor");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter profiles that have kyc data; generate signed URLs for documents
  const withKyc = await Promise.all(
    (data || [])
      .filter((p: any) => p.vendor_details?.kyc)
      .map(async (p: any) => {
        const kyc = { ...p.vendor_details.kyc };

        if (kyc.document_url) {
          try {
            const storagePath = extractStoragePath(kyc.document_url);
            const { data: signed } = await admin.storage
              .from("kyc-documents")
              .createSignedUrl(storagePath, 3600); // 1-hour TTL
            if (signed?.signedUrl) {
              kyc.signed_document_url = signed.signedUrl;
            }
          } catch {
            // Non-blocking — admin can still review without the document preview
          }
        }

        return {
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          kyc,
        };
      })
  );

  return NextResponse.json({ vendors: withKyc });
}

// POST: approve or reject KYC
export async function POST(req: Request) {
  const { user, allowed } = await authorizeAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { vendorId, action, reason } = await req.json();
  if (!vendorId || !action) {
    return NextResponse.json({ error: "Missing vendorId or action" }, { status: 400 });
  }

  const admin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch current vendor_details
  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("vendor_details, full_name, email")
    .eq("id", vendorId)
    .maybeSingle();

  if (fetchError || !profile) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const existing = (profile.vendor_details as Record<string, unknown>) || {};
  const existingKyc = (existing.kyc as Record<string, unknown>) || {};

  const newStatus = action === "approve" ? "approved" : "rejected";

  const updatedKyc = {
    ...existingKyc,
    status: newStatus,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
    ...(action === "reject" && reason ? { rejection_reason: reason } : {}),
  };

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      vendor_details: {
        ...existing,
        kyc: updatedKyc,
      },
    })
    .eq("id", vendorId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://oaktix.com.ng";

  // Send approval email
  if (action === "approve" && profile.email) {
    await sendKYCApprovedEmail({
      to: profile.email,
      organizerName: profile.full_name ?? "Organizer",
      dashboardUrl: `${siteUrl}/organizer/finances`,
    });
  }

  // Send rejection email
  if (action === "reject" && profile.email) {
    await sendKYCRejectedEmail({
      to: profile.email,
      organizerName: profile.full_name ?? "Organizer",
      rejectionReason: reason || undefined,
      dashboardUrl: `${siteUrl}/organizer/finances`,
    });
  }

  return NextResponse.json({ success: true, status: newStatus });
}
