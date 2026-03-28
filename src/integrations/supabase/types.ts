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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          advisor_approved: boolean | null
          applied_at: string
          coordinator_approved: boolean | null
          cover_letter: string | null
          id: string
          internship_id: string
          interview_date: string | null
          notes: string | null
          resume_url: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          student_id: string
          updated_at: string
        }
        Insert: {
          advisor_approved?: boolean | null
          applied_at?: string
          coordinator_approved?: boolean | null
          cover_letter?: string | null
          id?: string
          internship_id: string
          interview_date?: string | null
          notes?: string | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          student_id: string
          updated_at?: string
        }
        Update: {
          advisor_approved?: boolean | null
          applied_at?: string
          coordinator_approved?: boolean | null
          cover_letter?: string | null
          id?: string
          internship_id?: string
          interview_date?: string | null
          notes?: string | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          company_name: string
          company_size: string | null
          created_at: string
          description: string | null
          id: string
          industry: string | null
          location: string | null
          logo_url: string | null
          profile_id: string
          updated_at: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          company_name: string
          company_size?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          profile_id: string
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          company_name?: string
          company_size?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          profile_id?: string
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          approved: boolean | null
          approved_by: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          size: number | null
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          approved?: boolean | null
          approved_by?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          size?: number | null
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          approved?: boolean | null
          approved_by?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          size?: number | null
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          application_id: string
          created_at: string
          evaluator_id: string
          feedback: string | null
          id: string
          learning_outcomes: string[] | null
          rating: number | null
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          evaluator_id: string
          feedback?: string | null
          id?: string
          learning_outcomes?: string[] | null
          rating?: number | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          evaluator_id?: string
          feedback?: string | null
          id?: string
          learning_outcomes?: string[] | null
          rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty: {
        Row: {
          created_at: string
          id: string
          max_advisees: number | null
          office_hours: string | null
          office_location: string | null
          profile_id: string
          specialization: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_advisees?: number | null
          office_hours?: string | null
          office_location?: string | null
          profile_id: string
          specialization?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_advisees?: number | null
          office_hours?: string | null
          office_location?: string | null
          profile_id?: string
          specialization?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          company_id: string
          created_at: string
          deadline: string | null
          department_id: string | null
          description: string
          duration: string | null
          end_date: string | null
          id: string
          location: string | null
          positions_available: number | null
          positions_filled: number | null
          remote: boolean | null
          requirements: string[] | null
          skills_required: string[] | null
          start_date: string | null
          status: Database["public"]["Enums"]["internship_status"] | null
          stipend: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deadline?: string | null
          department_id?: string | null
          description: string
          duration?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          positions_available?: number | null
          positions_filled?: number | null
          remote?: boolean | null
          requirements?: string[] | null
          skills_required?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["internship_status"] | null
          stipend?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deadline?: string | null
          department_id?: string | null
          description?: string
          duration?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          positions_available?: number | null
          positions_filled?: number | null
          remote?: boolean | null
          requirements?: string[] | null
          skills_required?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["internship_status"] | null
          stipend?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internships_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          email: string
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          advisor_id: string | null
          bio: string | null
          created_at: string
          gpa: number | null
          graduation_year: number | null
          id: string
          interests: string[] | null
          linkedin_url: string | null
          major: string | null
          portfolio_url: string | null
          profile_id: string
          resume_url: string | null
          skills: string[] | null
          student_id: string
          updated_at: string
        }
        Insert: {
          advisor_id?: string | null
          bio?: string | null
          created_at?: string
          gpa?: number | null
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          linkedin_url?: string | null
          major?: string | null
          portfolio_url?: string | null
          profile_id: string
          resume_url?: string | null
          skills?: string[] | null
          student_id: string
          updated_at?: string
        }
        Update: {
          advisor_id?: string | null
          bio?: string | null
          created_at?: string
          gpa?: number | null
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          linkedin_url?: string | null
          major?: string | null
          portfolio_url?: string | null
          profile_id?: string
          resume_url?: string | null
          skills?: string[] | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          totalUsers: number
          students: number
          companies: number
          advisors: number
          coordinators: number
          admins: number
          activeCompanies: number
          activeInternships: number
          incompleteOnboarding: number
          unverifiedCompanies: number
          pendingApplications: number
        }
      }
      get_company_applicant_student_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_role_distribution: {
        Args: Record<PropertyKey, never>
        Returns: { role: string; count: number }[]
      }
      get_user_department: { Args: { _user_id: string }; Returns: string }
      get_user_profile_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      sync_auth_users_to_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          success: boolean
          syncedCount: number
          message: string
        }
      }
    }
    Enums: {
      app_role: "student" | "company" | "advisor" | "coordinator" | "admin"
      application_status:
        | "applied"
        | "interview"
        | "waiting"
        | "accepted"
        | "rejected"
      internship_status: "draft" | "active" | "closed" | "filled"
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
      app_role: ["student", "company", "advisor", "coordinator", "admin"],
      application_status: [
        "applied",
        "interview",
        "waiting",
        "accepted",
        "rejected",
      ],
      internship_status: ["draft", "active", "closed", "filled"],
    },
  },
} as const
