import { createClient } from "@/lib/supabase/server";
import type {
  Professional,
  ProfessionalCategory,
  ProfessionalFilters,
  PaginatedProfessionals,
  ProfessionalInquiry,
  ProfessionalPortfolio,
  ProfessionalReview,
  ProfessionalAnalytics,
} from "./types";

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────

export async function getCategories(): Promise<ProfessionalCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professional_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("getCategories error:", error);
    return [];
  }
  return data as ProfessionalCategory[];
}

export async function getCategoryBySlug(
  slug: string
): Promise<ProfessionalCategory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professional_categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return null;
  return data as ProfessionalCategory | null;
}

export async function getCategoriesWithCounts(): Promise<
  (ProfessionalCategory & { professional_count: number })[]
> {
  const supabase = await createClient();
  // Get categories
  const { data: categories, error } = await supabase
    .from("professional_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !categories?.length) return [];

  // Count only approved professionals per category
  const counts = await Promise.all(
    categories.map(async (cat) => {
      const { count } = await supabase
        .from("professionals")
        .select("*", { count: "exact", head: true })
        .eq("category_id", cat.id)
        .eq("status", "approved");
      return { id: cat.id, count: count ?? 0 };
    })
  );

  const countMap = Object.fromEntries(counts.map((c) => [c.id, c.count]));

  return categories.map((cat) => ({
    ...(cat as ProfessionalCategory),
    professional_count: countMap[cat.id] ?? 0,
  }));
}

// ─────────────────────────────────────────────────────────────
// PROFESSIONALS — Directory
// ─────────────────────────────────────────────────────────────

export async function getProfessionals(
  filters: ProfessionalFilters = {}
): Promise<PaginatedProfessionals> {
  const {
    search,
    category_slug,
    city,
    state,
    min_rating,
    max_price,
    min_price,
    verified,
    featured,
    sort = "most_popular",
    page = 1,
    limit = 20,
  } = filters;

  const supabase = await createClient();

  let query = supabase
    .from("professionals")
    .select(
      `
      *,
      category:professional_categories(id, name, slug, icon)
    `,
      { count: "exact" }
    )
    .eq("status", "approved");

  // Category filter (by slug — join through category)
  if (category_slug) {
    const { data: cat } = await supabase
      .from("professional_categories")
      .select("id")
      .eq("slug", category_slug)
      .maybeSingle();
    if (cat?.id) {
      query = query.eq("category_id", cat.id);
    }
  }

  if (city) query = query.ilike("city", `%${city}%`);
  if (state) query = query.ilike("state", `%${state}%`);
  if (verified) query = query.eq("verified", true);
  if (featured) query = query.eq("featured", true);
  if (min_rating) query = query.gte("average_rating", min_rating);
  if (min_price) query = query.gte("starting_price", min_price);
  if (max_price) query = query.lte("starting_price", max_price);

  // Full-text search
  if (search) {
    query = query.or(
      `professional_name.ilike.%${search}%,business_name.ilike.%${search}%,headline.ilike.%${search}%,city.ilike.%${search}%`
    );
  }

  // Sorting
  switch (sort) {
    case "rating":
      query = query.order("average_rating", { ascending: false });
      break;
    case "price_asc":
      query = query.order("starting_price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("starting_price", { ascending: false, nullsFirst: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "most_reviewed":
      query = query.order("total_reviews", { ascending: false });
      break;
    case "most_popular":
    default:
      query = query
        .order("featured", { ascending: false })
        .order("profile_views", { ascending: false })
        .order("average_rating", { ascending: false });
      break;
  }

  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("getProfessionals error:", error);
    return { professionals: [], total: 0, page, limit, hasMore: false };
  }

  return {
    professionals: (data ?? []) as Professional[],
    total: count ?? 0,
    page,
    limit,
    hasMore: (count ?? 0) > offset + limit,
  };
}

export async function getFeaturedProfessionals(
  limit = 8
): Promise<Professional[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professionals")
    .select("*, category:professional_categories(id, name, slug, icon)")
    .eq("status", "approved")
    .eq("featured", true)
    .order("average_rating", { ascending: false })
    .limit(limit);

  return (data ?? []) as Professional[];
}

export async function getFeaturedByCategory(
  limitPerCategory = 4
): Promise<{ category: ProfessionalCategory; professionals: Professional[] }[]> {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("professional_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(8);

  if (!categories?.length) return [];

  const results = await Promise.all(
    categories.map(async (cat) => {
      const { data: professionals } = await supabase
        .from("professionals")
        .select("*, category:professional_categories(id, name, slug, icon)")
        .eq("status", "approved")
        .eq("category_id", cat.id)
        .order("featured", { ascending: false })
        .order("average_rating", { ascending: false })
        .limit(limitPerCategory);

      return {
        category: cat as ProfessionalCategory,
        professionals: (professionals ?? []) as Professional[],
      };
    })
  );

  return results.filter((r) => r.professionals.length > 0);
}

// ─────────────────────────────────────────────────────────────
// PROFESSIONAL — Single Profile
// ─────────────────────────────────────────────────────────────

export async function getProfessionalBySlug(
  slug: string
): Promise<Professional | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(`
      *,
      category:professional_categories(id, name, slug, icon, description),
      portfolio:professional_portfolio(*),
      reviews:professional_reviews(*)
    `)
    .eq("slug", slug)
    .eq("status", "approved")
    .order("display_order", { referencedTable: "professional_portfolio", ascending: true })
    .order("created_at", { referencedTable: "professional_reviews", ascending: false })
    .limit(10, { referencedTable: "professional_reviews" })
    .maybeSingle();

  if (error || !data) return null;

  // Increment profile_views asynchronously (fire and forget)
  supabase
    .from("professionals")
    .update({ profile_views: (data.profile_views ?? 0) + 1 })
    .eq("id", data.id)
    .then(() => {});

  return data as Professional;
}

export async function getProfessionalById(id: string): Promise<Professional | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(
      `
      *,
      category:professional_categories(id, name, slug, icon)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  return data as Professional | null;
}

export async function getProfessionalByUserId(
  userId: string
): Promise<Professional | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(
      `
      *,
      category:professional_categories(id, name, slug, icon)
    `
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return null;
  return data as Professional | null;
}

export async function getRelatedProfessionals(
  professionalId: string,
  categoryId: string,
  city: string | null,
  limit = 4
): Promise<Professional[]> {
  const supabase = await createClient();
  let query = supabase
    .from("professionals")
    .select("*, category:professional_categories(id, name, slug, icon)")
    .eq("status", "approved")
    .eq("category_id", categoryId)
    .neq("id", professionalId)
    .order("average_rating", { ascending: false })
    .limit(limit);

  if (city) {
    query = query.ilike("city", `%${city}%`);
  }

  const { data } = await query;
  return (data ?? []) as Professional[];
}

// ─────────────────────────────────────────────────────────────
// PORTFOLIO
// ─────────────────────────────────────────────────────────────

export async function getPortfolio(
  professionalId: string
): Promise<ProfessionalPortfolio[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professional_portfolio")
    .select("*")
    .eq("professional_id", professionalId)
    .order("display_order", { ascending: true });

  return (data ?? []) as ProfessionalPortfolio[];
}

// ─────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────

export async function getReviews(
  professionalId: string,
  limit = 20
): Promise<ProfessionalReview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professional_reviews")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ProfessionalReview[];
}

// ─────────────────────────────────────────────────────────────
// INQUIRIES
// ─────────────────────────────────────────────────────────────

export async function getInquiriesForProfessional(
  userId: string
): Promise<ProfessionalInquiry[]> {
  const supabase = await createClient();

  // Get professional record first
  const { data: prof } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!prof?.id) return [];

  const { data } = await supabase
    .from("professional_inquiries")
    .select("*")
    .eq("professional_id", prof.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as ProfessionalInquiry[];
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────

export async function getAnalytics(
  professionalId: string,
  days = 30
): Promise<ProfessionalAnalytics[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("professional_analytics")
    .select("*")
    .eq("professional_id", professionalId)
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: true });

  return (data ?? []) as ProfessionalAnalytics[];
}

// ─────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────

export async function getAllProfessionalsAdmin(filters?: {
  status?: string;
  search?: string;
}): Promise<Professional[]> {
  const supabase = await createClient();
  let query = supabase
    .from("professionals")
    .select("*, category:professional_categories(id, name, slug, icon)")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.or(
      `professional_name.ilike.%${filters.search}%,business_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  const { data } = await query;
  return (data ?? []) as Professional[];
}
