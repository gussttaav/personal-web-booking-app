// DB-02: Manually authored Database type based on migrations 0001–0003.
// Regenerate with: supabase gen types typescript --project-id <ref> > src/infrastructure/supabase/types.ts
// Note: all tables require a `Relationships` array for the GenericTable constraint.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id:         string;
          email:      string;
          name:       string;
          role:       "student" | "teacher" | "admin";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?:         string;
          email:       string;
          name?:       string;
          role?:       "student" | "teacher" | "admin";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?:         string;
          email?:      string;
          name?:       string;
          role?:       "student" | "teacher" | "admin";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_packs: {
        Row: {
          id:                string;
          user_id:           string;
          pack_size:         5 | 10;
          credits_remaining: number;
          stripe_payment_id: string;
          expires_at:        string;
          created_at:        string;
          updated_at:        string;
          source:            string;
        };
        Insert: {
          id?:               string;
          user_id:           string;
          pack_size:         number;
          credits_remaining: number;
          stripe_payment_id: string;
          expires_at:        string;
          created_at?:       string;
          updated_at?:       string;
          source?:           string;
        };
        Update: {
          id?:               string;
          user_id?:          string;
          pack_size?:        number;
          credits_remaining?: number;
          stripe_payment_id?: string;
          expires_at?:       string;
          created_at?:       string;
          updated_at?:       string;
          source?:           string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_packs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      bookings: {
        Row: {
          id:                string;
          user_id:           string;
          credit_pack_id:    string | null;
          session_type:      "free15min" | "session1h" | "session2h" | "pack";
          starts_at:         string;
          ends_at:           string;
          status:            "confirmed" | "cancelled" | "completed" | "no_show";
          calendar_event_id: string | null;
          cancel_token:      string | null;
          join_token:        string | null;
          note:              string | null;
          stripe_payment_id: string | null;
          created_at:        string;
          updated_at:        string;
          source:            string;
        };
        Insert: {
          id?:               string;
          user_id:           string;
          credit_pack_id?:   string | null;
          session_type:      string;
          starts_at:         string;
          ends_at:           string;
          status?:           string;
          calendar_event_id?: string | null;
          cancel_token?:     string | null;
          join_token?:       string | null;
          note?:             string | null;
          stripe_payment_id?: string | null;
          created_at?:       string;
          updated_at?:       string;
          source?:           string;
        };
        Update: {
          id?:               string;
          user_id?:          string;
          credit_pack_id?:   string | null;
          session_type?:     string;
          starts_at?:        string;
          ends_at?:          string;
          status?:           string;
          calendar_event_id?: string | null;
          cancel_token?:     string | null;
          join_token?:       string | null;
          note?:             string | null;
          stripe_payment_id?: string | null;
          created_at?:       string;
          updated_at?:       string;
          source?:           string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_credit_pack_id_fkey";
            columns: ["credit_pack_id"];
            isOneToOne: false;
            referencedRelation: "credit_packs";
            referencedColumns: ["id"];
          }
        ];
      };
      zoom_sessions: {
        Row: {
          id:               string;
          booking_id:       string;
          session_id:       string;
          session_name:     string;
          session_passcode: string;
          duration_minutes: number;
          started_at:       string | null;
          ended_at:         string | null;
          created_at:       string;
        };
        Insert: {
          id?:              string;
          booking_id:       string;
          session_id?:      string;
          session_name:     string;
          session_passcode: string;
          duration_minutes?: number;
          started_at?:      string | null;
          ended_at?:        string | null;
          created_at?:      string;
        };
        Update: {
          id?:              string;
          booking_id?:      string;
          session_id?:      string;
          session_name?:    string;
          session_passcode?: string;
          duration_minutes?: number;
          started_at?:      string | null;
          ended_at?:        string | null;
          created_at?:      string;
        };
        Relationships: [
          {
            foreignKeyName: "zoom_sessions_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id:               string;
          user_id:          string;
          stripe_payment_id: string;
          amount_cents:     number;
          currency:         string;
          status:           "pending" | "succeeded" | "refunded" | "failed";
          checkout_type:    "pack" | "single";
          metadata:         Json;
          created_at:       string;
        };
        Insert: {
          id?:              string;
          user_id:          string;
          stripe_payment_id: string;
          amount_cents:     number;
          currency?:        string;
          status?:          string;
          checkout_type:    string;
          metadata?:        Json;
          created_at?:      string;
        };
        Update: {
          id?:              string;
          user_id?:         string;
          stripe_payment_id?: string;
          amount_cents?:    number;
          currency?:        string;
          status?:          string;
          checkout_type?:   string;
          metadata?:        Json;
          created_at?:      string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_log: {
        Row: {
          id:         number;
          user_id:    string | null;
          action:     string;
          details:    Json;
          created_at: string;
        };
        Insert: {
          user_id?:    string | null;
          action:      string;
          details?:    Json;
          created_at?: string;
        };
        Update: {
          user_id?:    string | null;
          action?:     string;
          details?:    Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      session_messages: {
        Row: {
          id:              number;
          zoom_session_id: string;
          content:         string;
          created_at:      string;
        };
        Insert: {
          zoom_session_id: string;
          content:         string;
          created_at?:     string;
        };
        Update: {
          zoom_session_id?: string;
          content?:         string;
          created_at?:      string;
        };
        Relationships: [
          {
            foreignKeyName: "session_messages_zoom_session_id_fkey";
            columns: ["zoom_session_id"];
            isOneToOne: false;
            referencedRelation: "zoom_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      slot_locks: {
        Row: {
          start_iso:  string;
          expires_at: string;
        };
        Insert: {
          start_iso:  string;
          expires_at: string;
        };
        Update: {
          start_iso?:  string;
          expires_at?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          idempotency_key: string;
          processed_at:    string;
        };
        Insert: {
          idempotency_key: string;
          processed_at?:   string;
        };
        Update: {
          idempotency_key?: string;
          processed_at?:    string;
        };
        Relationships: [];
      };
      failed_bookings: {
        Row: {
          stripe_session_id: string;
          email:             string;
          start_iso:         string;
          failed_at:         string;
          error:             string;
        };
        Insert: {
          stripe_session_id: string;
          email:             string;
          start_iso:         string;
          failed_at:         string;
          error:             string;
        };
        Update: {
          stripe_session_id?: string;
          email?:             string;
          start_iso?:         string;
          failed_at?:         string;
          error?:             string;
        };
        Relationships: [];
      };
    };
    Views:  Record<string, never>;
    Functions: {
      decrement_credit: {
        Args:    { p_user_id: string };
        Returns: Json;
      };
      restore_credit: {
        Args:    { p_user_id: string };
        Returns: Json;
      };
      acquire_slot_lock: {
        Args:    { p_start_iso: string; p_duration_minutes: number };
        Returns: boolean;
      };
      release_slot_lock: {
        Args:    { p_start_iso: string };
        Returns: undefined;
      };
    };
  };
};
