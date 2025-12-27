export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      event_attendees: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          status: Database["public"]["Enums"]["attendee_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          status?: Database["public"]["Enums"]["attendee_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          status?: Database["public"]["Enums"]["attendee_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_speakers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_order: number | null
          event_id: string
          id: string
          name: string
          profile_id: string | null
          title: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_order?: number | null
          event_id: string
          id?: string
          name: string
          profile_id?: string | null
          title?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_order?: number | null
          event_id?: string
          id?: string
          name?: string
          profile_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_speakers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          image_url: string | null
          is_published: boolean | null
          location: string | null
          start_time: string
          title: string
          updated_at: string
          virtual_link: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string | null
          start_time: string
          title: string
          updated_at?: string
          virtual_link?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          virtual_link?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          career_level: Database["public"]["Enums"]["career_level"]
          company: string
          created_at: string
          created_by: string | null
          description: string | null
          external_url: string | null
          id: string
          is_published: boolean | null
          location: string | null
          title: string
          updated_at: string
          work_arrangement: Database["public"]["Enums"]["work_arrangement"]
        }
        Insert: {
          career_level: Database["public"]["Enums"]["career_level"]
          company: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          is_published?: boolean | null
          location?: string | null
          title: string
          updated_at?: string
          work_arrangement: Database["public"]["Enums"]["work_arrangement"]
        }
        Update: {
          career_level?: Database["public"]["Enums"]["career_level"]
          company?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          is_published?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string
          work_arrangement?: Database["public"]["Enums"]["work_arrangement"]
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          renewed_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          renewed_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          renewed_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_replies: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          likes: number | null
          likes_count: number
          reply_count: number
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          likes?: number | null
          likes_count?: number
          reply_count?: number
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          likes?: number | null
          likes_count?: number
          reply_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          location: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          job_title?: string | null
          location?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          location?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          company: string | null
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          location: string | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          company?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          location?: string | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          company?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          location?: string | null
          resource_type?: Database["public"]["Enums"]["resource_type"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      attendee_status: "registered" | "waitlisted" | "cancelled" | "attended"
      career_level:
        | "internship"
        | "entry_level"
        | "associate"
        | "mid_senior"
        | "director"
        | "executive"
      event_type: "virtual" | "in_person" | "hybrid"
      membership_status: "active" | "expired" | "cancelled" | "pending"
      resource_type: "job" | "article" | "video" | "download" | "website"
      work_arrangement: "remote" | "hybrid" | "on_site"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      attendee_status: ["registered", "waitlisted", "cancelled", "attended"],
      career_level: [
        "internship",
        "entry_level",
        "associate",
        "mid_senior",
        "director",
        "executive",
      ],
      event_type: ["virtual", "in_person", "hybrid"],
      membership_status: ["active", "expired", "cancelled", "pending"],
      resource_type: ["job", "article", "video", "download", "website"],
      work_arrangement: ["remote", "hybrid", "on_site"],
    },
  },
} as const
