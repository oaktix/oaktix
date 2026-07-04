// ============================================================
// PROFESSIONALS MARKETPLACE — TypeScript Types
// ============================================================

export interface ProfessionalCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  // computed
  professional_count?: number;
}

export interface Professional {
  id: string;
  user_id: string | null;
  category_id: string | null;

  business_name: string | null;
  professional_name: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  years_of_experience: number;

  profile_photo: string | null;
  cover_image: string | null;

  phone: string | null;
  email: string | null;
  whatsapp: string | null;

  website: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  tiktok: string | null;
  youtube: string | null;

  city: string | null;
  state: string | null;
  country: string;

  pricing_type: 'fixed' | 'hourly' | 'per_event' | 'negotiable';
  starting_price: number | null;
  currency: string;

  verified: boolean;
  featured: boolean;
  top_rated: boolean;
  most_booked: boolean;
  fast_responder: boolean;
  new_professional: boolean;

  average_rating: number;
  total_reviews: number;
  total_bookings: number;
  profile_views: number;
  inquiry_count: number;

  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejection_reason: string | null;
  approved_at: string | null;
  approved_by: string | null;

  created_at: string;
  updated_at: string;

  // joined
  category?: ProfessionalCategory | null;
  portfolio?: ProfessionalPortfolio[];
  reviews?: ProfessionalReview[];
}

export interface ProfessionalPortfolio {
  id: string;
  professional_id: string;
  title: string | null;
  description: string | null;
  media_type: 'image' | 'video';
  image_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  display_order: number;
  created_at: string;
}

export interface ProfessionalReview {
  id: string;
  professional_id: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  reviewer_email: string | null;
  rating: number;
  review: string | null;
  is_verified: boolean;
  is_flagged: boolean;
  created_at: string;
}

export interface ProfessionalInquiry {
  id: string;
  professional_id: string;
  sender_id: string | null;

  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;

  event_type: string | null;
  event_date: string | null;
  event_location: string | null;
  guest_count: number | null;
  budget: number | null;
  currency: string;

  message: string | null;

  status: 'new' | 'read' | 'contacted' | 'quoted' | 'booked' | 'closed' | 'spam';
  professional_reply: string | null;
  replied_at: string | null;

  created_at: string;

  // joined
  professional?: Pick<Professional, 'professional_name' | 'slug' | 'profile_photo'>;
}

export interface ProfessionalBooking {
  id: string;
  professional_id: string;
  client_id: string | null;
  inquiry_id: string | null;

  client_name: string;
  client_email: string;
  client_phone: string | null;

  event_type: string | null;
  event_date: string | null;
  event_location: string | null;

  agreed_amount: number | null;
  currency: string;

  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed';
  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface EventTeamRequest {
  id: string;
  requester_id: string | null;

  requester_name: string;
  requester_email: string;
  requester_phone: string | null;

  event_type: string;
  event_date: string | null;
  event_location: string | null;
  city: string | null;
  state: string | null;
  guest_count: number | null;
  total_budget: number | null;
  currency: string;
  additional_notes: string | null;

  status: 'draft' | 'submitted' | 'in_progress' | 'completed' | 'cancelled';

  created_at: string;
  updated_at: string;

  // joined
  members?: EventTeamMember[];
}

export interface EventTeamMember {
  id: string;
  request_id: string;
  professional_id: string;
  category_id: string | null;

  status: 'pending' | 'accepted' | 'declined' | 'no_response';
  quoted_amount: number | null;
  professional_message: string | null;
  responded_at: string | null;

  created_at: string;

  // joined
  professional?: Pick<Professional, 'professional_name' | 'slug' | 'profile_photo' | 'average_rating' | 'verified'>;
  category?: Pick<ProfessionalCategory, 'name' | 'icon'>;
}

export interface ProfessionalAnalytics {
  id: string;
  professional_id: string;
  date: string;
  profile_views: number;
  portfolio_views: number;
  contact_clicks: number;
  inquiry_count: number;
  booking_count: number;
}

// ── Form / Input Types ────────────────────────────────────────

export interface ProfessionalRegistrationStep1 {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface ProfessionalRegistrationStep2 {
  professional_name: string;
  business_name?: string;
  category_id: string;
  headline: string;
  bio: string;
  years_of_experience: number;
  city: string;
  state: string;
  pricing_type: Professional['pricing_type'];
  starting_price?: number;
}

export interface ProfessionalRegistrationStep3 {
  profile_photo?: string;
  cover_image?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

export interface InquiryFormData {
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  event_type?: string;
  event_date?: string;
  event_location?: string;
  guest_count?: number;
  budget?: number;
  message: string;
}

export interface EventTeamBuilderFormData {
  requester_name: string;
  requester_email: string;
  requester_phone?: string;
  event_type: string;
  event_date?: string;
  event_location?: string;
  city?: string;
  state?: string;
  guest_count?: number;
  total_budget?: number;
  additional_notes?: string;
  selected_professional_ids: string[];
}

// ── Query / Filter Types ──────────────────────────────────────

export interface ProfessionalFilters {
  search?: string;
  category_slug?: string;
  city?: string;
  state?: string;
  min_rating?: number;
  max_price?: number;
  min_price?: number;
  verified?: boolean;
  featured?: boolean;
  sort?: 'rating' | 'price_asc' | 'price_desc' | 'newest' | 'most_popular' | 'most_reviewed';
  page?: number;
  limit?: number;
}

export interface PaginatedProfessionals {
  professionals: Professional[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ── Nigerian States ───────────────────────────────────────────

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
] as const;

export type NigerianState = typeof NIGERIAN_STATES[number];

export const EVENT_TYPES = [
  'Wedding', 'Birthday Party', 'Corporate Event', 'Conference',
  'Concert', 'Festival', 'Product Launch', 'Award Night',
  'Funeral / Memorial', 'Graduation Party', 'Baby Shower',
  'Engagement Party', 'Networking Event', 'Workshop', 'Other'
] as const;

export const PRICING_TYPE_LABELS: Record<Professional['pricing_type'], string> = {
  fixed: 'Fixed Price',
  hourly: 'Per Hour',
  per_event: 'Per Event',
  negotiable: 'Negotiable',
};
