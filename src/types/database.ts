// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/** Matches the status check constraint on `disputes` in supabase/schema.sql. */
export type DisputeStatus =
  | "open"
  | "under_review"
  | "waiting_for_evidence"
  | "resolved_complainant"
  | "resolved_respondent"
  | "closed"
  | "rejected"
  | "escalated";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: "renter" | "lessor" | "admin";
          verification_status: "not_started" | "pending" | "under_review" | "verified" | "rejected" | "resubmission_required";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "renter" | "lessor" | "admin";
          verification_status?: "not_started" | "pending" | "under_review" | "verified" | "rejected" | "resubmission_required";
          is_active?: boolean;
        };
        Update: AnyRecord & {
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "renter" | "lessor" | "admin";
          verification_status?: "not_started" | "pending" | "under_review" | "verified" | "rejected" | "resubmission_required";
          is_active?: boolean;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          description?: string | null;
        };
        Update: AnyRecord & {
          name?: string;
          slug?: string;
          icon?: string | null;
          description?: string | null;
        };
      };
      listings: {
        Row: {
          id: string;
          lessor_id: string;
          category_id: string | null;
          title: string;
          description: string | null;
          condition: "new" | "like_new" | "good" | "fair" | "poor";
          price_per_day: number;
          price_per_week: number | null;
          price_per_month: number | null;
          security_deposit: number;
          incidental_fee: number | null;
          location: string | null;
          city: string | null;
          status: "draft" | "pending_review" | "published" | "unpublished" | "rejected" | "suspended";
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
        };
        Insert: {
          lessor_id: string;
          category_id?: string | null;
          title: string;
          description?: string | null;
          condition?: "new" | "like_new" | "good" | "fair" | "poor";
          price_per_day: number;
          price_per_week?: number | null;
          price_per_month?: number | null;
          security_deposit: number;
          incidental_fee?: number | null;
          location?: string | null;
          city?: string | null;
          status?: "draft" | "pending_review" | "published" | "unpublished" | "rejected" | "suspended";
          pickup_available?: boolean;
          delivery_available?: boolean;
          delivery_fee?: number | null;
          rental_rules?: string | null;
          cancellation_policy?: string | null;
          primary_image_url?: string | null;
        };
        Update: AnyRecord & {
          category_id?: string | null;
          title?: string;
          description?: string | null;
          condition?: "new" | "like_new" | "good" | "fair" | "poor";
          price_per_day?: number;
          security_deposit?: number;
          status?: "draft" | "pending_review" | "published" | "unpublished" | "rejected" | "suspended";
          primary_image_url?: string | null;
        };
      };
      rental_requests: {
        Row: {
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
          status: "draft" | "pending" | "accepted" | "declined" | "cancelled" | "payment_pending" | "confirmed" | "active" | "returned" | "completed" | "disputed";
          renter_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          listing_id: string;
          renter_id: string;
          lessor_id: string;
          start_date: string;
          end_date: string;
          total_days: number;
          rental_fee: number;
          security_deposit: number;
          incidental_fee?: number | null;
          delivery_fee?: number | null;
          total_amount: number;
          pickup_option?: "pickup" | "delivery";
          status?: "draft" | "pending" | "accepted" | "declined" | "cancelled" | "payment_pending" | "confirmed" | "active" | "returned" | "completed" | "disputed";
          renter_message?: string | null;
        };
        Update: AnyRecord & {
          status?: "draft" | "pending" | "accepted" | "declined" | "cancelled" | "payment_pending" | "confirmed" | "active" | "returned" | "completed" | "disputed";
        };
      };
      payments: {
        Row: {
          id: string;
          rental_request_id: string;
          payer_id: string;
          amount: number;
          payment_type: "reservation_fee" | "incidental_fee" | "balance" | "deposit" | "refund";
          status: "pending" | "processing" | "paid" | "failed" | "cancelled" | "refunded" | "held" | "released" | "disputed";
          payment_method: string | null;
          transaction_ref: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          rental_request_id: string;
          payer_id: string;
          amount: number;
          payment_type: "reservation_fee" | "incidental_fee" | "balance" | "deposit" | "refund";
          status?: "pending" | "processing" | "paid" | "failed" | "cancelled" | "refunded" | "held" | "released" | "disputed";
          payment_method?: string | null;
          transaction_ref?: string | null;
          notes?: string | null;
        };
        Update: AnyRecord & {
          status?: "pending" | "processing" | "paid" | "failed" | "cancelled" | "refunded" | "held" | "released" | "disputed";
          notes?: string | null;
        };
      };
      disputes: {
        Row: {
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
        };
        Insert: {
          rental_request_id: string;
          complainant_id: string;
          respondent_id: string;
          reason: string;
          description?: string | null;
          status?: DisputeStatus;
        };
        Update: AnyRecord & {
          status?: DisputeStatus;
          resolution?: string | null;
          resolution_amount?: number | null;
          resolved_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read?: boolean;
        };
        Update: AnyRecord & {
          is_read?: boolean;
        };
      };
      conversations: {
        Row: {
          id: string;
          renter_id: string;
          lessor_id: string;
          rental_request_id: string | null;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          renter_id: string;
          lessor_id: string;
          rental_request_id?: string | null;
        };
        Update: AnyRecord & {
          last_message_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read?: boolean;
          link?: string | null;
        };
        Update: AnyRecord & {
          is_read?: boolean;
        };
      };
      reviews: {
        Row: {
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
        };
        Insert: {
          rental_request_id: string;
          reviewer_id: string;
          reviewee_id: string;
          listing_id?: string | null;
          overall_rating: number;
          communication_rating?: number | null;
          accuracy_rating?: number | null;
          condition_rating?: number | null;
          comment?: string | null;
          review_type?: "renter_to_lessor" | "lessor_to_renter" | null;
        };
        Update: AnyRecord & {
          comment?: string | null;
        };
      };
      identity_verifications: {
        Row: {
          id: string;
          user_id: string;
          status: "not_started" | "pending" | "under_review" | "verified" | "rejected" | "resubmission_required";
          id_type: string | null;
          id_number: string | null;
          front_image_url: string | null;
          back_image_url: string | null;
          selfie_url: string | null;
          admin_notes: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          status?: "not_started" | "pending" | "under_review" | "verified" | "rejected" | "resubmission_required";
          id_type?: string | null;
          id_number?: string | null;
          front_image_url?: string | null;
          back_image_url?: string | null;
          selfie_url?: string | null;
        };
        Update: AnyRecord & {
          status?: "not_started" | "pending" | "under_review" | "verified" | "rejected" | "resubmission_required";
          admin_notes?: string | null;
          reviewed_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          changed_by: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          changes: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          changed_by?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          changes?: Record<string, unknown> | null;
        };
        Update: AnyRecord;
      };
      platform_settings: {
        Row: {
          id: boolean;
          site_name: string;
          support_email: string;
          platform_fee_percent: number;
          reservation_fee_percent: number;
          max_rental_days: number;
          require_verification: boolean;
          allow_guest_browse: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: boolean;
          site_name?: string;
          support_email?: string;
          platform_fee_percent?: number;
          reservation_fee_percent?: number;
          max_rental_days?: number;
          require_verification?: boolean;
          allow_guest_browse?: boolean;
          updated_by?: string | null;
        };
        Update: AnyRecord & {
          site_name?: string;
          support_email?: string;
          platform_fee_percent?: number;
          reservation_fee_percent?: number;
          max_rental_days?: number;
          require_verification?: boolean;
          allow_guest_browse?: boolean;
          updated_by?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      /** Aggregate platform counters + prior-month comparators. Admin only. */
      admin_dashboard_stats: {
        Args: Record<string, never>;
        Returns: AdminDashboardStats;
      };
      /** One row per month, zero-filled, oldest first. Admin only. */
      admin_monthly_series: {
        Args: { p_months?: number };
        Returns: AdminMonthlyPoint[];
      };
      /** Published listings grouped by category. Admin only. */
      admin_category_breakdown: {
        Args: Record<string, never>;
        Returns: { name: string; value: number }[];
      };
      /** Payment totals over the whole table, not a single page. Admin only. */
      admin_payment_totals: {
        Args: Record<string, never>;
        Returns: { processed: number; held: number; refunded: number; count: number };
      };
      lessor_dashboard_stats: {
        Args: { p_lessor: string };
        Returns: LessorDashboardStats;
      };
      lessor_monthly_series: {
        Args: { p_lessor: string; p_months?: number };
        Returns: LessorMonthlyPoint[];
      };
      lessor_earnings_summary: {
        Args: { p_lessor: string };
        Returns: LessorEarningsSummary;
      };
      /** Callable by anon — powers the landing page category tiles. */
      public_category_counts: {
        Args: Record<string, never>;
        Returns: PublicCategoryCount[];
      };
      profile_stats: {
        Args: { p_user: string };
        Returns: ProfileStats;
      };
      increment_listing_views: {
        Args: { p_listing: string };
        Returns: void;
      };
      platform_fee_rate: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
  };
};

// ── Return shapes for the RPCs above ────────────────────────────

export interface AdminDashboardStats {
  total_users: number;
  renters: number;
  lessors: number;
  admins: number;
  total_listings: number;
  published_listings: number;
  active_rentals: number;
  completed_rentals: number;
  pending_verifications: number;
  open_disputes: number;
  gross_volume: number;
  platform_revenue: number;
  users_this_month: number;
  users_prev_month: number;
  rentals_this_month: number;
  rentals_prev_month: number;
  revenue_this_month: number;
  revenue_prev_month: number;
}

export interface AdminMonthlyPoint {
  month: string;
  month_start: string;
  gross_volume: number;
  platform_revenue: number;
  rentals: number;
  renters: number;
  lessors: number;
}

export interface LessorDashboardStats {
  total_listings: number;
  published_listings: number;
  active_rentals: number;
  pending_requests: number;
  completed_rentals: number;
  total_earnings: number;
  month_earnings: number;
  avg_rating: number | null;
  review_count: number;
  open_disputes: number;
  total_views: number;
}

export interface LessorMonthlyPoint {
  month: string;
  earnings: number;
  rentals: number;
  accepted: number;
  declined: number;
}

export interface LessorEarningsSummary {
  gross: number;
  net: number;
  this_month: number;
  released: number;
  pending: number;
  fee_percent: number;
}

export interface PublicCategoryCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  listing_count: number;
}

export interface ProfileStats {
  avg_rating: number | null;
  review_count: number;
  completed_rentals: number;
}
