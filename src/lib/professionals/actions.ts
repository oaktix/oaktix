"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  InquiryFormData,
  ProfessionalRegistrationStep2,
  ProfessionalRegistrationStep3,
  EventTeamBuilderFormData,
} from "./types";

type InquiryStatus = "new" | "read" | "contacted" | "quoted" | "booked" | "closed" | "spam";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/-+$/g, "")
    .trim();
}

async function ensureUniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  baseSlug: string,
  attempt = 0
): Promise<string> {
  const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
  const { data } = await supabase
    .from("professionals")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return slug;
  return ensureUniqueSlug(supabase, baseSlug, attempt + 1);
}

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, allowed: false };

  const role = user.user_metadata?.role as string | undefined;
  if (role === "admin" || role === "super_admin") return { user, allowed: true };

  // Fall back to profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const dbRole = profile?.role as string | undefined;
  return {
    user,
    allowed: dbRole === "admin" || dbRole === "super_admin",
  };
}

// ─────────────────────────────────────────────────────────────
// PROFESSIONAL REGISTRATION
// ─────────────────────────────────────────────────────────────

export async function createProfessionalProfile(
  step2: ProfessionalRegistrationStep2,
  step3: ProfessionalRegistrationStep3
): Promise<{ success: boolean; error?: string; slug?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Check if user already has a professional profile
  const { data: existing } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "You already have a professional profile" };
  }

  // Generate unique slug
  const baseSlug = generateSlug(step2.professional_name);
  const slug = await ensureUniqueSlug(supabase, baseSlug);

  const { data, error } = await supabase
    .from("professionals")
    .insert({
      user_id: user.id,
      category_id: step2.category_id,
      professional_name: step2.professional_name,
      business_name: step2.business_name || null,
      slug,
      headline: step2.headline,
      bio: step2.bio,
      years_of_experience: step2.years_of_experience,
      city: step2.city,
      state: step2.state,
      pricing_type: step2.pricing_type,
      starting_price: step2.starting_price || null,
      profile_photo: step3.profile_photo || null,
      cover_image: step3.cover_image || null,
      instagram: step3.instagram || null,
      facebook: step3.facebook || null,
      twitter: step3.twitter || null,
      youtube: step3.youtube || null,
      tiktok: step3.tiktok || null,
      website: step3.website || null,
      status: "pending",
      new_professional: true,
    })
    .select("slug")
    .single();

  if (error) {
    console.error("createProfessionalProfile error:", error);
    return { success: false, error: "Failed to create profile. Please try again." };
  }

  revalidatePath("/professionals");

  // Fire-and-forget registration emails
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://oaktix.com.ng";
    const { sendProfessionalRegistrationAdminEmail, sendProfessionalRegistrationConfirmationEmail } = await import("@/lib/email");

    // Fetch category name for the admin email
    let categoryName = "Unknown";
    if (step2.category_id) {
      const { data: cat } = await supabase
        .from("professional_categories")
        .select("name")
        .eq("id", step2.category_id)
        .maybeSingle();
      if (cat?.name) categoryName = cat.name;
    }

    await Promise.all([
      sendProfessionalRegistrationAdminEmail({
        professionalName: step2.professional_name,
        category: categoryName,
        city: step2.city ?? null,
        state: step2.state ?? null,
        applicantEmail: user.email ?? "unknown",
        adminUrl: `${siteUrl}/admin/professionals`,
      }),
      user.email
        ? sendProfessionalRegistrationConfirmationEmail({
            to: user.email,
            professionalName: step2.professional_name,
          })
        : Promise.resolve(),
    ]);
  } catch (emailErr) {
    console.error("createProfessionalProfile — registration emails failed:", emailErr);
  }

  return { success: true, slug: data.slug };
}

export async function updateProfessionalProfile(
  professionalId: string,
  updates: Partial<{
    professional_name: string;
    business_name: string;
    headline: string;
    bio: string;
    years_of_experience: number;
    city: string;
    state: string;
    pricing_type: string;
    starting_price: number;
    profile_photo: string;
    cover_image: string;
    phone: string;
    email: string;
    whatsapp: string;
    website: string;
    instagram: string;
    facebook: string;
    twitter: string;
    tiktok: string;
    youtube: string;
    linkedin: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("professionals")
    .update(updates)
    .eq("id", professionalId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/professional");
  revalidatePath("/professionals");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// PORTFOLIO
// ─────────────────────────────────────────────────────────────

export async function addPortfolioItem(
  professionalId: string,
  item: {
    title?: string;
    description?: string;
    media_type: "image" | "video";
    /** Pass either image_url/video_url directly, or media_url as a generic alias */
    image_url?: string;
    video_url?: string;
    media_url?: string;
    thumbnail_url?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Verify ownership
  const { data: prof } = await supabase
    .from("professionals")
    .select("id")
    .eq("id", professionalId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prof) return { success: false, error: "Unauthorized" };

  // Map media_url alias to the correct column
  const imageUrl = item.image_url ?? (item.media_type === "image" ? item.media_url : undefined);
  const videoUrl = item.video_url ?? (item.media_type === "video" ? item.media_url : undefined);

  const { error } = await supabase.from("professional_portfolio").insert({
    professional_id: professionalId,
    title: item.title,
    description: item.description,
    media_type: item.media_type,
    image_url: imageUrl ?? null,
    video_url: videoUrl ?? null,
    thumbnail_url: item.thumbnail_url ?? null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/professional/portfolio");
  return { success: true };
}

export async function deletePortfolioItem(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Fetch the user's professional ID first — ownership check avoids SQL injection
  const { data: prof } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prof?.id) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("professional_portfolio")
    .delete()
    .eq("id", itemId)
    .eq("professional_id", prof.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/professional/portfolio");
  return { success: true };
}

export async function updatePortfolioItem(
  itemId: string,
  updates: {
    title?: string;
    description?: string;
    video_url?: string | null;
    image_url?: string | null;
    thumbnail_url?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { data: prof } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prof?.id) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("professional_portfolio")
    .update(updates)
    .eq("id", itemId)
    .eq("professional_id", prof.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/professional/portfolio");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// INQUIRIES
// ─────────────────────────────────────────────────────────────

export async function submitInquiry(
  professionalId: string,
  formData: InquiryFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("professional_inquiries").insert({
    professional_id: professionalId,
    sender_id: user?.id || null,
    name: formData.name,
    email: formData.email,
    phone: formData.phone || null,
    whatsapp: formData.whatsapp || null,
    event_type: formData.event_type || null,
    event_date: formData.event_date || null,
    event_location: formData.event_location || null,
    guest_count: formData.guest_count || null,
    budget: formData.budget || null,
    message: formData.message,
    status: "new",
  });

  if (error) {
    console.error("submitInquiry error:", error);
    return { success: false, error: "Failed to send inquiry. Please try again." };
  }

  // Fire-and-forget email notification to the professional
  try {
    const { data: prof } = await supabase
      .from("professionals")
      .select("professional_name, email, user_id")
      .eq("id", professionalId)
      .maybeSingle();

    if (prof) {
      // Prefer the professional's direct contact email; fall back to their account email
      let recipientEmail = prof.email;
      if (!recipientEmail && prof.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", prof.user_id)
          .maybeSingle();
        recipientEmail = profile?.email ?? null;
      }

      if (recipientEmail) {
        const { sendProfessionalInquiryEmail } = await import("@/lib/email");
        const dashboardUrl =
          process.env.NEXT_PUBLIC_SITE_URL
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/professional/inquiries`
            : "https://oaktix.com.ng/professional/inquiries";

        await sendProfessionalInquiryEmail({
          to: recipientEmail,
          professionalName: prof.professional_name,
          clientName: formData.name,
          clientEmail: formData.email,
          eventType: formData.event_type,
          eventDate: formData.event_date,
          message: formData.message,
          dashboardUrl,
        });
      }
    }
  } catch (emailErr) {
    console.error("submitInquiry — email notification failed:", emailErr);
    // Non-blocking: inquiry was saved successfully, email failure should not surface to client
  }

  return { success: true };
}

export async function replyToInquiry(
  inquiryId: string,
  reply: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Verify the inquiry belongs to this user's professional profile
  const { data: prof } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prof?.id) return { success: false, error: "Unauthorized" };

  const { data: inquiry } = await supabase
    .from("professional_inquiries")
    .select("id")
    .eq("id", inquiryId)
    .eq("professional_id", prof.id)
    .maybeSingle();

  if (!inquiry) return { success: false, error: "Inquiry not found" };

  const { error } = await supabase
    .from("professional_inquiries")
    .update({
      professional_reply: reply,
      status: "contacted",
      replied_at: new Date().toISOString(),
    })
    .eq("id", inquiryId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/professional/inquiries");
  return { success: true };
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Verify ownership through the professional profile
  const { data: prof } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prof?.id) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("professional_inquiries")
    .update({ status })
    .eq("id", inquiryId)
    .eq("professional_id", prof.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/professional/inquiries");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────

export async function submitReview(
  professionalId: string,
  data: {
    rating: number;
    review?: string;
    reviewer_name?: string;
    reviewer_email?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Please sign in to leave a review." };

  const { error } = await supabase.from("professional_reviews").insert({
    professional_id: professionalId,
    reviewer_id: user.id,
    reviewer_name: data.reviewer_name || null,
    reviewer_email: data.reviewer_email || null,
    rating: data.rating,
    review: data.review || null,
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// EVENT TEAM BUILDER
// ─────────────────────────────────────────────────────────────

export async function submitEventTeamRequest(
  formData: EventTeamBuilderFormData
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Create the team request
  const { data: request, error: reqError } = await supabase
    .from("event_team_requests")
    .insert({
      requester_id: user?.id || null,
      requester_name: formData.requester_name,
      requester_email: formData.requester_email,
      requester_phone: formData.requester_phone || null,
      event_type: formData.event_type,
      event_date: formData.event_date || null,
      event_location: formData.event_location || null,
      city: formData.city || null,
      state: formData.state || null,
      guest_count: formData.guest_count || null,
      total_budget: formData.total_budget || null,
      additional_notes: formData.additional_notes || null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (reqError || !request) {
    return { success: false, error: "Failed to create team request." };
  }

  // Add team members (selected professionals)
  if (formData.selected_professional_ids.length > 0) {
    const members = formData.selected_professional_ids.map((profId) => ({
      request_id: request.id,
      professional_id: profId,
      status: "pending",
    }));

    const { error: membersError } = await supabase
      .from("event_team_members")
      .insert(members);

    if (membersError) {
      console.error("Failed to add team members:", membersError);
    }
  }

  return { success: true, requestId: request.id };
}

// ─────────────────────────────────────────────────────────────
// ADMIN ACTIONS — all require admin or super_admin role
// ─────────────────────────────────────────────────────────────

export async function approveProfessional(
  professionalId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { user, allowed } = await assertAdmin(supabase);

  if (!user) return { success: false, error: "Not authenticated" };
  if (!allowed) return { success: false, error: "Forbidden" };

  const { error } = await supabase
    .from("professionals")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      new_professional: false,
    })
    .eq("id", professionalId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/professionals");
  revalidatePath("/professionals");

  // Fire-and-forget approval email to the professional
  try {
    const { data: prof } = await supabase
      .from("professionals")
      .select("professional_name, email, user_id, slug")
      .eq("id", professionalId)
      .maybeSingle();

    if (prof) {
      let recipientEmail = prof.email;
      if (!recipientEmail && prof.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", prof.user_id)
          .maybeSingle();
        recipientEmail = profile?.email ?? null;
      }

      if (recipientEmail) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://oaktix.com.ng";
        const { sendProfessionalApprovalEmail } = await import("@/lib/email");
        await sendProfessionalApprovalEmail({
          to: recipientEmail,
          professionalName: prof.professional_name,
          profileUrl: `${siteUrl}/professionals/${prof.slug}`,
        });
      }
    }
  } catch (emailErr) {
    console.error("approveProfessional — approval email failed:", emailErr);
  }

  return { success: true };
}

export async function rejectProfessional(
  professionalId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { user, allowed } = await assertAdmin(supabase);

  if (!user) return { success: false, error: "Not authenticated" };
  if (!allowed) return { success: false, error: "Forbidden" };

  const { error } = await supabase
    .from("professionals")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", professionalId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/professionals");
  return { success: true };
}

export async function suspendProfessional(
  professionalId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { user, allowed } = await assertAdmin(supabase);

  if (!user) return { success: false, error: "Not authenticated" };
  if (!allowed) return { success: false, error: "Forbidden" };

  const { error } = await supabase
    .from("professionals")
    .update({ status: "suspended" })
    .eq("id", professionalId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/professionals");
  revalidatePath("/professionals");
  return { success: true };
}

export async function toggleProfessionalFeatured(
  professionalId: string,
  featured: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { user, allowed } = await assertAdmin(supabase);

  if (!user) return { success: false, error: "Not authenticated" };
  if (!allowed) return { success: false, error: "Forbidden" };

  const { error } = await supabase
    .from("professionals")
    .update({ featured })
    .eq("id", professionalId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/professionals");
  revalidatePath("/professionals");
  return { success: true };
}

export async function toggleProfessionalVerified(
  professionalId: string,
  verified: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { user, allowed } = await assertAdmin(supabase);

  if (!user) return { success: false, error: "Not authenticated" };
  if (!allowed) return { success: false, error: "Forbidden" };

  const { error } = await supabase
    .from("professionals")
    .update({ verified })
    .eq("id", professionalId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/professionals");
  revalidatePath("/professionals");
  return { success: true };
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { user, allowed } = await assertAdmin(supabase);

  if (!user) return { success: false, error: "Not authenticated" };
  if (!allowed) return { success: false, error: "Forbidden" };

  const { error } = await supabase.from("professional_categories").insert(data);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/professionals/categories");
  revalidatePath("/professionals");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// ADMIN — full profile edit and delete
// ─────────────────────────────────────────────────────────────

export async function adminUpdateProfessional(
  professionalId: string,
  updates: {
    professional_name?: string;
    business_name?: string | null;
    headline?: string | null;
    bio?: string | null;
    years_of_experience?: number;
    category_id?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    website?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
    pricing_type?: "fixed" | "hourly" | "per_event" | "negotiable";
    starting_price?: number | null;
    currency?: string;
    verified?: boolean;
    featured?: boolean;
    top_rated?: boolean;
    most_booked?: boolean;
    fast_responder?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { user, allowed } = await assertAdmin(supabase);

  if (!user) return { success: false, error: "Not authenticated" };
  if (!allowed) return { success: false, error: "Forbidden" };

  const { error } = await supabase
    .from("professionals")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", professionalId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/professionals");
  revalidatePath(`/admin/professionals/${professionalId}`);
  revalidatePath("/professionals");
  return { success: true };
}

export async function adminDeleteProfessional(
  professionalId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { user, allowed } = await assertAdmin(supabase);

  if (!user) return { success: false, error: "Not authenticated" };
  if (!allowed) return { success: false, error: "Forbidden" };

  // Delete portfolio items first (FK constraint)
  await supabase
    .from("professional_portfolio")
    .delete()
    .eq("professional_id", professionalId);

  const { error } = await supabase
    .from("professionals")
    .delete()
    .eq("id", professionalId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/professionals");
  revalidatePath("/professionals");
  return { success: true };
}
