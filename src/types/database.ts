export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_video_capability_facts: {
        Row: {
          capability_key: string
          created_at: string
          evidence_summary: string
          id: string
          limitation_summary: string | null
          numeric_value: number | null
          offering_id: string
          review_due_at: string
          source_id: string
          structured_value: Json | null
          support_level: string
          text_value: string | null
          updated_at: string
          verified_at: string
        }
        Insert: {
          capability_key: string
          created_at?: string
          evidence_summary: string
          id?: string
          limitation_summary?: string | null
          numeric_value?: number | null
          offering_id: string
          review_due_at: string
          source_id: string
          structured_value?: Json | null
          support_level: string
          text_value?: string | null
          updated_at?: string
          verified_at: string
        }
        Update: {
          capability_key?: string
          created_at?: string
          evidence_summary?: string
          id?: string
          limitation_summary?: string | null
          numeric_value?: number | null
          offering_id?: string
          review_due_at?: string
          source_id?: string
          structured_value?: Json | null
          support_level?: string
          text_value?: string | null
          updated_at?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_video_capability_facts_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "ai_video_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_video_capability_facts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "ai_video_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_video_offerings: {
        Row: {
          api_access_status: string
          created_at: string
          display_name: string
          id: string
          lifecycle_status: string
          offering_key: string
          offering_type: string
          official_identifier: string | null
          ownership_type: string
          provider_id: string
          recommendation_eligible: boolean
          review_due_at: string
          summary: string
          sunset_at: string | null
          updated_at: string
          verified_at: string
        }
        Insert: {
          api_access_status: string
          created_at?: string
          display_name: string
          id?: string
          lifecycle_status: string
          offering_key: string
          offering_type: string
          official_identifier?: string | null
          ownership_type: string
          provider_id: string
          recommendation_eligible?: boolean
          review_due_at: string
          summary: string
          sunset_at?: string | null
          updated_at?: string
          verified_at: string
        }
        Update: {
          api_access_status?: string
          created_at?: string
          display_name?: string
          id?: string
          lifecycle_status?: string
          offering_key?: string
          offering_type?: string
          official_identifier?: string | null
          ownership_type?: string
          provider_id?: string
          recommendation_eligible?: boolean
          review_due_at?: string
          summary?: string
          sunset_at?: string | null
          updated_at?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_video_offerings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_video_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_video_providers: {
        Row: {
          api_access_status: string
          catalogue_notice: string | null
          created_at: string
          display_name: string
          id: string
          lifecycle_status: string
          recommendation_eligible: boolean
          review_due_at: string
          summary: string
          sunset_at: string | null
          updated_at: string
          vendor_name: string
          verified_at: string
        }
        Insert: {
          api_access_status: string
          catalogue_notice?: string | null
          created_at?: string
          display_name: string
          id: string
          lifecycle_status: string
          recommendation_eligible?: boolean
          review_due_at: string
          summary: string
          sunset_at?: string | null
          updated_at?: string
          vendor_name: string
          verified_at: string
        }
        Update: {
          api_access_status?: string
          catalogue_notice?: string | null
          created_at?: string
          display_name?: string
          id?: string
          lifecycle_status?: string
          recommendation_eligible?: boolean
          review_due_at?: string
          summary?: string
          sunset_at?: string | null
          updated_at?: string
          vendor_name?: string
          verified_at?: string
        }
        Relationships: []
      }
      ai_video_sources: {
        Row: {
          created_at: string
          id: string
          offering_id: string | null
          provider_id: string
          published_or_updated_at: string | null
          source_kind: string
          title: string
          url: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          offering_id?: string | null
          provider_id: string
          published_or_updated_at?: string | null
          source_kind: string
          title: string
          url: string
          verified_at: string
        }
        Update: {
          created_at?: string
          id?: string
          offering_id?: string | null
          provider_id?: string
          published_or_updated_at?: string | null
          source_kind?: string
          title?: string
          url?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_video_sources_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "ai_video_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_video_sources_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_video_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      video_briefs: {
        Row: {
          aspect_ratio: string | null
          budget_priority: string | null
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          objective: string | null
          project_id: string
          publishing_destination: string | null
          quality_priority: string | null
          requires_camera_control: boolean
          requires_character_consistency: boolean
          requires_commercial_use: boolean
          requires_dialogue: boolean
          requires_exact_text_visibility: boolean
          requires_first_last_frame_control: boolean
          requires_lip_sync: boolean
          requires_logo_accuracy: boolean
          requires_multiple_locations: boolean
          requires_native_audio: boolean
          requires_product_consistency: boolean
          requires_reference_images: boolean
          requires_video_extension: boolean
          requires_voiceover: boolean
          source_text: string | null
          source_type: string
          source_url: string | null
          target_audience: string | null
          tone: string | null
          updated_at: string
          user_constraints: string | null
          video_category: string | null
          visual_style: string | null
          working_title: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          budget_priority?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          objective?: string | null
          project_id: string
          publishing_destination?: string | null
          quality_priority?: string | null
          requires_camera_control?: boolean
          requires_character_consistency?: boolean
          requires_commercial_use?: boolean
          requires_dialogue?: boolean
          requires_exact_text_visibility?: boolean
          requires_first_last_frame_control?: boolean
          requires_lip_sync?: boolean
          requires_logo_accuracy?: boolean
          requires_multiple_locations?: boolean
          requires_native_audio?: boolean
          requires_product_consistency?: boolean
          requires_reference_images?: boolean
          requires_video_extension?: boolean
          requires_voiceover?: boolean
          source_text?: string | null
          source_type: string
          source_url?: string | null
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_constraints?: string | null
          video_category?: string | null
          visual_style?: string | null
          working_title?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          budget_priority?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          objective?: string | null
          project_id?: string
          publishing_destination?: string | null
          quality_priority?: string | null
          requires_camera_control?: boolean
          requires_character_consistency?: boolean
          requires_commercial_use?: boolean
          requires_dialogue?: boolean
          requires_exact_text_visibility?: boolean
          requires_first_last_frame_control?: boolean
          requires_lip_sync?: boolean
          requires_logo_accuracy?: boolean
          requires_multiple_locations?: boolean
          requires_native_audio?: boolean
          requires_product_consistency?: boolean
          requires_reference_images?: boolean
          requires_video_extension?: boolean
          requires_voiceover?: boolean
          source_text?: string | null
          source_type?: string
          source_url?: string | null
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_constraints?: string | null
          video_category?: string | null
          visual_style?: string | null
          working_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_briefs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      prompt_pilot_catalogue_is_api_access_status: {
        Args: { p_status: string }
        Returns: boolean
      }
      prompt_pilot_catalogue_is_capability_key: {
        Args: { p_key: string }
        Returns: boolean
      }
      prompt_pilot_catalogue_is_https_url: {
        Args: { p_url: string }
        Returns: boolean
      }
      prompt_pilot_catalogue_is_lifecycle_status: {
        Args: { p_status: string }
        Returns: boolean
      }
      prompt_pilot_catalogue_is_machine_safe_key: {
        Args: { p_key: string }
        Returns: boolean
      }
      prompt_pilot_catalogue_is_offering_type: {
        Args: { p_type: string }
        Returns: boolean
      }
      prompt_pilot_catalogue_is_ownership_type: {
        Args: { p_type: string }
        Returns: boolean
      }
      prompt_pilot_catalogue_is_provider_id: {
        Args: { p_id: string }
        Returns: boolean
      }
      prompt_pilot_catalogue_is_source_kind: {
        Args: { p_kind: string }
        Returns: boolean
      }
      prompt_pilot_catalogue_is_support_level: {
        Args: { p_level: string }
        Returns: boolean
      }
      prompt_pilot_catalogue_recommendation_allowed: {
        Args: { p_lifecycle: string; p_recommendation_eligible: boolean }
        Returns: boolean
      }
      prompt_pilot_complete_video_brief: {
        Args: { project_uuid: string }
        Returns: string
      }
      prompt_pilot_soft_delete_project: {
        Args: { project_id: string }
        Returns: undefined
      }
      prompt_pilot_video_brief_is_complete: {
        Args: {
          p_aspect_ratio: string
          p_budget_priority: string
          p_duration_seconds: number
          p_objective: string
          p_publishing_destination: string
          p_quality_priority: string
          p_source_text: string
          p_source_type: string
          p_source_url: string
          p_target_audience: string
          p_tone: string
          p_video_category: string
          p_visual_style: string
          p_working_title: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

