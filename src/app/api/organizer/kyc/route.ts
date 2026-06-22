import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendKYCSubmittedAdminEmail, sendKYCPendingOrganizerEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parse FormData
    const formData = await req.formData();
    const docType = formData.get("type") as string;
    const nin = formData.get("nin") as string | null;
    const documentFile = formData.get("document") as File | null;

    if (!docType) {
      return NextResponse.json({ error: "Document type is required." }, { status: 400 });
    }

    const isNIN = docType === "nin";
    let documentUrl: string | null = null;

    // Handle image upload for non-NIN document types
    if (!isNIN) {
      if (!documentFile) {
        return NextResponse.json({ error: "Document file is required." }, { status: 400 });
      }

      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (documentFile.size > maxSize) {
        return NextResponse.json({ error: "File too large. Maximum size is 5 MB." }, { status: 400 });
      }

      // Ensure kyc-documents bucket exists (idempotent)
      await admin.storage.createBucket("kyc-documents", {
        public: false,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        fileSizeLimit: maxSize,
      });

      const ext = documentFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${docType}-${Date.now()}.${ext}`;

      const arrayBuffer = await documentFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await admin.storage
        .from("kyc-documents")
        .upload(path, buffer, {
          contentType: documentFile.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("KYC upload error:", uploadError);
        return NextResponse.json({ error: "Failed to upload document. Please try again." }, { status: 500 });
      }

      // Store the storage path (not a public URL — bucket is private)
      documentUrl = path;
    }

    // Fetch current profile
    const { data: profile } = await admin
      .from("profiles")
      .select("vendor_details, full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const existing = (profile?.vendor_details as Record<string, unknown>) || {};

    const kycPayload = {
      submitted_at: new Date().toISOString(),
      status: "pending",
      type: docType,
      ...(isNIN && nin ? { nin } : {}),
      ...(documentUrl ? { document_url: documentUrl } : {}),
    };

    // Merge KYC data into vendor_details
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        vendor_details: {
          ...existing,
          kyc: kycPayload,
        },
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("KYC update error:", updateError);
      return NextResponse.json({ error: "Failed to save KYC data." }, { status: 500 });
    }

    // Notify admin
    const docTypeLabel =
      {
        nin: "NIN (National ID Number)",
        nin_slip: "NIN Slip",
        voters_card: "Voter's Card",
        drivers_license: "Driver's License",
        passport: "International Passport",
      }[docType] ?? docType;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://oaktix.com.ng";
    await sendKYCSubmittedAdminEmail({
      organizerName: profile?.full_name ?? "Unknown Organizer",
      organizerEmail: user.email ?? "unknown",
      documentType: docTypeLabel,
      adminUrl: `${siteUrl}/admin/kyc`,
    });

    // Notify organizer — submission confirmation
    if (user.email) {
      await sendKYCPendingOrganizerEmail({
        to: user.email,
        organizerName: profile?.full_name ?? "Organizer",
        documentType: docTypeLabel,
        dashboardUrl: `${siteUrl}/organizer/finances`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("KYC route error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
