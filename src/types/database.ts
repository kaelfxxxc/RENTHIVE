// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

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
          reporter_id: string;
          respondent_id: string;
          reason: string;
          description: string;
          status: "open" | "under_review" | "waiting_for_evidence" | "resolved" | "rejected" | "escalated" | "closed";
          admin_notes: string | null;
          resolution: string | null;
          resolution_amount: number | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          rental_request_id: string;
          reporter_id: string;
          respondent_id: string;
          reason: string;
          description: string;
          status?: "open" | "under_review" | "waiting_for_evidence" | "resolved" | "rejected" | "escalated" | "closed";
        };
        Update: AnyRecord & {
          status?: "open" | "under_review" | "waiting_for_evidence" | "resolved" | "rejected" | "escalated" | "closed";
          admin_notes?: string | null;
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
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          rental_request_id: string;
          reviewer_id: string;
          reviewee_id: string;
          listing_id?: string | null;
          rating: number;
          comment?: string | null;
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
          user_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          previous_value: Record<string, unknown> | null;
          new_value: Record<string, unknown> | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          previous_value?: Record<string, unknown> | null;
          new_value?: Record<string, unknown> | null;
          ip_address?: string | null;
        };
        Update: AnyRecord;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
