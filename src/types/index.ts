export type UserRole = "renter" | "lessor" | "admin";
export type VerificationStatus = "not_started" | "pending" | "under_review" | "verified" | "rejected" | "resubmission_required";
export type ListingStatus = "draft" | "pending_review" | "published" | "unpublished" | "rejected" | "suspended";
export type RentalStatus = "draft" | "pending" | "accepted" | "declined" | "cancelled" | "payment_pending" | "confirmed" | "active" | "returned" | "completed" | "disputed";
export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "cancelled" | "refunded" | "held" | "released" | "disputed";
export type DisputeStatus = "open" | "under_review" | "waiting_for_evidence" | "resolved_complainant" | "resolved_respondent" | "closed" | "rejected" | "escalated";
export type ProductCondition = "new" | "like_new" | "good" | "fair" | "poor";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  verification_status: VerificationStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  created_at: string;
}

export interface Listing {
  id: string;
  lessor_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  condition: ProductCondition;
  price_per_day: number;
  price_per_week: number | null;
  price_per_month: number | null;
  security_deposit: number;
  incidental_fee: number | null;
  location: string | null;
  city: string | null;
  status: ListingStatus;
  pickup_available: boolean;
  delivery_available: boolean;
  delivery_fee: number | null;
  rental_rules: string | null;
  cancellation_policy: string | null;
  views: number;
  average_rating: number | null;
  total_rentals: number;
  primary_image_url: string | null;
  created_at: string;
  updated_at: string;
  // joined
  lessor?: Profile;
  category?: Category;
}

export interface RentalRequest {
  id: string;
  listing_id: string;
  renter_id: string;
  lessor_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  rental_fee: number;
  security_deposit: number;
  incidental_fee: number | null;
  delivery_fee: number | null;
  total_amount: number;
  pickup_option: "pickup" | "delivery";
  status: RentalStatus;
  renter_message: string | null;
  created_at: string;
  updated_at: string;
  // joined
  listing?: Listing;
  renter?: Profile;
  lessor?: Profile;
}

export interface Payment {
  id: string;
  rental_request_id: string;
  payer_id: string;
  amount: number;
  payment_type: "reservation_fee" | "incidental_fee" | "balance" | "deposit" | "refund";
  status: PaymentStatus;
  payment_method: string | null;
  transaction_ref: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Conversation {
  id: string;
  renter_id: string;
  lessor_id: string;
  rental_request_id: string | null;
  last_message_at: string | null;
  created_at: string;
  renter?: Profile;
  lessor?: Profile;
  last_message?: Message;
  unread_count?: number;
}

export interface Review {
  id: string;
  rental_request_id: string;
  reviewer_id: string;
  reviewee_id: string;
  listing_id: string | null;
  overall_rating: number;
  communication_rating: number | null;
  accuracy_rating: number | null;
  condition_rating: number | null;
  comment: string | null;
  review_type: "renter_to_lessor" | "lessor_to_renter" | null;
  created_at: string;
  reviewer?: Profile;
}

export interface Dispute {
  id: string;
  rental_request_id: string;
  complainant_id: string;
  respondent_id: string;
  reason: string;
  description: string | null;
  status: DisputeStatus;
  resolution: string | null;
  resolution_amount: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  complainant?: Profile;
  respondent?: Profile;
  rental_request?: RentalRequest;
}

export interface AuditLog {
  id: string;
  changed_by: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
  actor?: Profile;
}

export interface PlatformSettings {
  site_name: string;
  support_email: string;
  platform_fee_percent: number;
  reservation_fee_percent: number;
  max_rental_days: number;
  require_verification: boolean;
  allow_guest_browse: boolean;
}
