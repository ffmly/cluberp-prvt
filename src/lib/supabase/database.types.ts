
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "audit_events": {
                  Row: {
                    "action": string,"actor_id": string,"after_state": NonNullable<Json>,"before_state": NonNullable<Json>,"club_id": string | null,"created_at": string,"id": string,"metadata": NonNullable<Json>,"resource_id": string | null,"resource_type": string,"university_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id": string,"after_state"?: NonNullable<Json>,"before_state"?: NonNullable<Json>,"club_id"?: string | null,"created_at"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"resource_id"?: string | null,"resource_type": string,"university_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string,"after_state"?: NonNullable<Json>,"before_state"?: NonNullable<Json>,"club_id"?: string | null,"created_at"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"resource_id"?: string | null,"resource_type"?: string,"university_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_events_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_events_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    }
                  ]
                },"campuses": {
                  Row: {
                    "address": string | null,"archived_at": string | null,"code": string,"created_at": string,"created_by": string,"id": string,"name": string,"status": string,"university_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"archived_at"?: string | null,"code": string,"created_at"?: string,"created_by": string,"id"?: string,"name": string,"status"?: string,"university_id": string,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"archived_at"?: string | null,"code"?: string,"created_at"?: string,"created_by"?: string,"id"?: string,"name"?: string,"status"?: string,"university_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "campuses_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "campuses_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    }
                  ]
                },"club_role_assignments": {
                  Row: {
                    "assigned_by": string,"club_id": string,"created_at": string,"ends_at": string | null,"id": string,"revocation_reason": string | null,"revoked_at": string | null,"revoked_by": string | null,"role_id": string,"starts_at": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_by": string,"club_id": string,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"revocation_reason"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"role_id": string,"starts_at"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "assigned_by"?: string,"club_id"?: string,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"revocation_reason"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"role_id"?: string,"starts_at"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_role_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_role_assignments_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_role_assignments_revoked_by_fkey"
      columns: ["revoked_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_role_assignments_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_role_assignments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"clubs": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"created_by": string,"description": string | null,"id": string,"name": string,"slug": string,"status": string,"university_id": string,"updated_at": string,"visibility": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"created_by": string,"description"?: string | null,"id"?: string,"name": string,"slug": string,"status"?: string,"university_id": string,"updated_at"?: string,"visibility"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"created_by"?: string,"description"?: string | null,"id"?: string,"name"?: string,"slug"?: string,"status"?: string,"university_id"?: string,"updated_at"?: string,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "clubs_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clubs_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    }
                  ]
                },"departments": {
                  Row: {
                    "archived_at": string | null,"code": string,"created_at": string,"created_by": string,"faculty_id": string,"id": string,"name": string,"status": string,"university_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"code": string,"created_at"?: string,"created_by": string,"faculty_id": string,"id"?: string,"name": string,"status"?: string,"university_id": string,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"code"?: string,"created_at"?: string,"created_by"?: string,"faculty_id"?: string,"id"?: string,"name"?: string,"status"?: string,"university_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "departments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "departments_faculty_id_university_id_fkey"
      columns: ["faculty_id","university_id"]
isOneToOne: false
      referencedRelation: "faculties"
      referencedColumns: ["id","university_id"]
    },{
      foreignKeyName: "departments_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    }
                  ]
                },"faculties": {
                  Row: {
                    "archived_at": string | null,"campus_id": string,"code": string,"created_at": string,"created_by": string,"id": string,"name": string,"status": string,"university_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"campus_id": string,"code": string,"created_at"?: string,"created_by": string,"id"?: string,"name": string,"status"?: string,"university_id": string,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"campus_id"?: string,"code"?: string,"created_at"?: string,"created_by"?: string,"id"?: string,"name"?: string,"status"?: string,"university_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "faculties_campus_id_university_id_fkey"
      columns: ["campus_id","university_id"]
isOneToOne: false
      referencedRelation: "campuses"
      referencedColumns: ["id","university_id"]
    },{
      foreignKeyName: "faculties_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "faculties_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    }
                  ]
                },"permissions": {
                  Row: {
                    "created_at": string,"description": string,"id": string,"key": string,"name": string,"scope_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description": string,"id"?: string,"key": string,"name": string,"scope_type": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"id"?: string,"key"?: string,"name"?: string,"scope_type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"platform_role_assignments": {
                  Row: {
                    "assigned_by": string,"created_at": string,"ends_at": string | null,"id": string,"revocation_reason": string | null,"revoked_at": string | null,"revoked_by": string | null,"role_id": string,"starts_at": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_by": string,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"revocation_reason"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"role_id": string,"starts_at"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "assigned_by"?: string,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"revocation_reason"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"role_id"?: string,"starts_at"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "platform_role_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "platform_role_assignments_revoked_by_fkey"
      columns: ["revoked_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "platform_role_assignments_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "platform_role_assignments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "account_status": string,"created_at": string,"display_name": string,"id": string,"locale": string,"onboarding_completed": boolean,"suspended_at": string | null,"suspended_by": string | null,"suspension_reason": string | null,"time_zone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_status"?: string,"created_at"?: string,"display_name": string,"id": string,"locale"?: string,"onboarding_completed"?: boolean,"suspended_at"?: string | null,"suspended_by"?: string | null,"suspension_reason"?: string | null,"time_zone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "account_status"?: string,"created_at"?: string,"display_name"?: string,"id"?: string,"locale"?: string,"onboarding_completed"?: boolean,"suspended_at"?: string | null,"suspended_by"?: string | null,"suspension_reason"?: string | null,"time_zone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_suspended_by_fkey"
      columns: ["suspended_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"role_permissions": {
                  Row: {
                    "created_at": string,"granted_by": string | null,"permission_id": string,"role_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"granted_by"?: string | null,"permission_id": string,"role_id": string
                  }
                  Update: {
                    "created_at"?: string,"granted_by"?: string | null,"permission_id"?: string,"role_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "role_permissions_granted_by_fkey"
      columns: ["granted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "role_permissions_permission_id_fkey"
      columns: ["permission_id"]
isOneToOne: false
      referencedRelation: "permissions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "role_permissions_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    }
                  ]
                },"roles": {
                  Row: {
                    "archived_at": string | null,"club_id": string | null,"created_at": string,"created_by": string | null,"description": string | null,"id": string,"is_system": boolean,"key": string,"name": string,"scope_type": string,"team_id": string | null,"university_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"club_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_system"?: boolean,"key": string,"name": string,"scope_type": string,"team_id"?: string | null,"university_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"club_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_system"?: boolean,"key"?: string,"name"?: string,"scope_type"?: string,"team_id"?: string | null,"university_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "roles_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "roles_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "roles_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "roles_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    }
                  ]
                },"team_role_assignments": {
                  Row: {
                    "assigned_by": string,"created_at": string,"ends_at": string | null,"id": string,"revocation_reason": string | null,"revoked_at": string | null,"revoked_by": string | null,"role_id": string,"starts_at": string,"team_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_by": string,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"revocation_reason"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"role_id": string,"starts_at"?: string,"team_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "assigned_by"?: string,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"revocation_reason"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"role_id"?: string,"starts_at"?: string,"team_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_role_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_role_assignments_revoked_by_fkey"
      columns: ["revoked_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_role_assignments_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_role_assignments_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_role_assignments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"teams": {
                  Row: {
                    "archived_at": string | null,"club_id": string,"created_at": string,"created_by": string,"description": string | null,"id": string,"name": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"club_id": string,"created_at"?: string,"created_by": string,"description"?: string | null,"id"?: string,"name": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"club_id"?: string,"created_at"?: string,"created_by"?: string,"description"?: string | null,"id"?: string,"name"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "teams_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teams_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"universities": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"created_by": string,"default_currency": string,"default_locale": string,"default_time_zone": string,"id": string,"name": string,"settings": NonNullable<Json>,"slug": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"created_by": string,"default_currency"?: string,"default_locale"?: string,"default_time_zone"?: string,"id"?: string,"name": string,"settings"?: NonNullable<Json>,"slug": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"created_by"?: string,"default_currency"?: string,"default_locale"?: string,"default_time_zone"?: string,"id"?: string,"name"?: string,"settings"?: NonNullable<Json>,"slug"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "universities_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"university_role_assignments": {
                  Row: {
                    "assigned_by": string,"created_at": string,"ends_at": string | null,"id": string,"revocation_reason": string | null,"revoked_at": string | null,"revoked_by": string | null,"role_id": string,"starts_at": string,"university_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_by": string,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"revocation_reason"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"role_id": string,"starts_at"?: string,"university_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "assigned_by"?: string,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"revocation_reason"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"role_id"?: string,"starts_at"?: string,"university_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "university_role_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "university_role_assignments_revoked_by_fkey"
      columns: ["revoked_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "university_role_assignments_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "university_role_assignments_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "university_role_assignments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"university_staff_assignments": {
                  Row: {
                    "assigned_by": string,"campus_id": string | null,"created_at": string,"department_id": string | null,"ends_at": string | null,"faculty_id": string | null,"id": string,"scope_type": string,"staff_type": string,"starts_at": string,"status": string,"title": string | null,"university_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_by": string,"campus_id"?: string | null,"created_at"?: string,"department_id"?: string | null,"ends_at"?: string | null,"faculty_id"?: string | null,"id"?: string,"scope_type": string,"staff_type": string,"starts_at"?: string,"status"?: string,"title"?: string | null,"university_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "assigned_by"?: string,"campus_id"?: string | null,"created_at"?: string,"department_id"?: string | null,"ends_at"?: string | null,"faculty_id"?: string | null,"id"?: string,"scope_type"?: string,"staff_type"?: string,"starts_at"?: string,"status"?: string,"title"?: string | null,"university_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "university_staff_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "university_staff_assignments_campus_id_university_id_fkey"
      columns: ["campus_id","university_id"]
isOneToOne: false
      referencedRelation: "campuses"
      referencedColumns: ["id","university_id"]
    },{
      foreignKeyName: "university_staff_assignments_department_id_university_id_fkey"
      columns: ["department_id","university_id"]
isOneToOne: false
      referencedRelation: "departments"
      referencedColumns: ["id","university_id"]
    },{
      foreignKeyName: "university_staff_assignments_faculty_id_university_id_fkey"
      columns: ["faculty_id","university_id"]
isOneToOne: false
      referencedRelation: "faculties"
      referencedColumns: ["id","university_id"]
    },{
      foreignKeyName: "university_staff_assignments_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "university_staff_assignments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "current_user_has_permission":
{ Args: { "permission_key": string,"scope_id"?: string,"scope_type": string }; Returns: boolean
                           },
"list_platform_audit_events":
{ Args: { "page_limit"?: number }; Returns: {
              "action": string,"actor_email": string,"actor_id": string,"actor_name": string,"after_state": Json,"before_state": Json,"created_at": string,"event_id": string,"metadata": Json,"resource_id": string,"resource_type": string
            }[]
                           },
"list_platform_users":
{ Args: { "page_limit"?: number,"page_offset"?: number,"search_query"?: string }; Returns: {
              "account_status": string,"created_at": string,"display_name": string,"email": string,"last_sign_in_at": string,"suspended_at": string,"suspension_reason": string,"user_id": string
            }[]
                           },
"list_university_staff":
{ Args: { "target_university_id": string }; Returns: {
              "assignment_id": string,"display_name": string,"email": string,"ends_at": string,"scope_id": string,"scope_type": string,"staff_type": string,"starts_at": string,"status": string,"title": string,"updated_at": string,"user_id": string
            }[]
                           },
"lookup_university_staff_candidate":
{ Args: { "email_query": string,"target_university_id": string }; Returns: {
              "display_name": string,"email": string,"user_id": string
            }[]
                           },
"set_user_account_status":
{ Args: { "new_status": string,"reason": string,"target_user_id": string }; Returns: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
