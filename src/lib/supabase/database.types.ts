
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "attendance_history": {
                  Row: {
                    "changed_by": string,"created_at": string,"id": string,"new_status": string,"previous_status": string,"reason": string,"registration_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_by": string,"created_at"?: string,"id"?: string,"new_status": string,"previous_status": string,"reason": string,"registration_id": string
                  }
                  Update: {
                    "changed_by"?: string,"created_at"?: string,"id"?: string,"new_status"?: string,"previous_status"?: string,"reason"?: string,"registration_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_history_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_history_registration_id_fkey"
      columns: ["registration_id"]
isOneToOne: false
      referencedRelation: "event_registrations"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_events": {
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
                },"club_events": {
                  Row: {
                    "approved_by": string | null,"cancellation_reason": string | null,"cancelled_at": string | null,"capacity": number | null,"club_id": string,"created_at": string,"created_by": string,"description": string,"eligibility": string,"ends_at": string,"event_type": string,"id": string,"location": string,"published_at": string | null,"registration_deadline": string,"starts_at": string,"status": string,"title": string,"updated_at": string,"visibility": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_by"?: string | null,"cancellation_reason"?: string | null,"cancelled_at"?: string | null,"capacity"?: number | null,"club_id": string,"created_at"?: string,"created_by": string,"description": string,"eligibility"?: string,"ends_at": string,"event_type": string,"id"?: string,"location": string,"published_at"?: string | null,"registration_deadline": string,"starts_at": string,"status"?: string,"title": string,"updated_at"?: string,"visibility"?: string
                  }
                  Update: {
                    "approved_by"?: string | null,"cancellation_reason"?: string | null,"cancelled_at"?: string | null,"capacity"?: number | null,"club_id"?: string,"created_at"?: string,"created_by"?: string,"description"?: string,"eligibility"?: string,"ends_at"?: string,"event_type"?: string,"id"?: string,"location"?: string,"published_at"?: string | null,"registration_deadline"?: string,"starts_at"?: string,"status"?: string,"title"?: string,"updated_at"?: string,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_events_approved_by_fkey"
      columns: ["approved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_events_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_events_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"club_invitations": {
                  Row: {
                    "accepted_by": string | null,"club_id": string,"created_at": string,"expires_at": string,"id": string,"invited_by": string,"membership_id": string | null,"recipient_email": string,"status": string,"token_digest": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_by"?: string | null,"club_id": string,"created_at"?: string,"expires_at": string,"id"?: string,"invited_by": string,"membership_id"?: string | null,"recipient_email": string,"status"?: string,"token_digest": string,"updated_at"?: string
                  }
                  Update: {
                    "accepted_by"?: string | null,"club_id"?: string,"created_at"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string,"membership_id"?: string | null,"recipient_email"?: string,"status"?: string,"token_digest"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_invitations_accepted_by_fkey"
      columns: ["accepted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_invitations_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_invitations_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_invitations_membership_id_fkey"
      columns: ["membership_id"]
isOneToOne: false
      referencedRelation: "club_memberships"
      referencedColumns: ["id"]
    }
                  ]
                },"club_memberships": {
                  Row: {
                    "club_id": string,"created_at": string,"created_by": string,"end_reason": string | null,"ended_at": string | null,"ended_by": string | null,"id": string,"joined_at": string,"status": string,"updated_at": string,"user_id": string,"valid_until": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "club_id": string,"created_at"?: string,"created_by": string,"end_reason"?: string | null,"ended_at"?: string | null,"ended_by"?: string | null,"id"?: string,"joined_at"?: string,"status"?: string,"updated_at"?: string,"user_id": string,"valid_until"?: string | null
                  }
                  Update: {
                    "club_id"?: string,"created_at"?: string,"created_by"?: string,"end_reason"?: string | null,"ended_at"?: string | null,"ended_by"?: string | null,"id"?: string,"joined_at"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string,"valid_until"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_memberships_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_memberships_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_memberships_ended_by_fkey"
      columns: ["ended_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_memberships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"club_requests": {
                  Row: {
                    "club_id": string | null,"created_at": string,"decision_reason": string | null,"id": string,"proposed_description": string | null,"proposed_name": string,"proposed_slug": string,"request_type": string,"reviewed_at": string | null,"reviewer_id": string | null,"status": string,"submitted_at": string,"submitter_id": string,"university_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "club_id"?: string | null,"created_at"?: string,"decision_reason"?: string | null,"id"?: string,"proposed_description"?: string | null,"proposed_name": string,"proposed_slug": string,"request_type": string,"reviewed_at"?: string | null,"reviewer_id"?: string | null,"status"?: string,"submitted_at"?: string,"submitter_id": string,"university_id": string,"updated_at"?: string
                  }
                  Update: {
                    "club_id"?: string | null,"created_at"?: string,"decision_reason"?: string | null,"id"?: string,"proposed_description"?: string | null,"proposed_name"?: string,"proposed_slug"?: string,"request_type"?: string,"reviewed_at"?: string | null,"reviewer_id"?: string | null,"status"?: string,"submitted_at"?: string,"submitter_id"?: string,"university_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_requests_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_requests_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_requests_submitter_id_fkey"
      columns: ["submitter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_requests_university_id_fkey"
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
                },"event_registrations": {
                  Row: {
                    "cancelled_at": string | null,"event_id": string,"id": string,"registered_at": string,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancelled_at"?: string | null,"event_id": string,"id"?: string,"registered_at"?: string,"status": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "cancelled_at"?: string | null,"event_id"?: string,"id"?: string,"registered_at"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_registrations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "club_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_registrations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_status_history": {
                  Row: {
                    "changed_by": string,"created_at": string,"event_id": string,"from_status": string | null,"id": string,"reason": string | null,"to_status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_by": string,"created_at"?: string,"event_id": string,"from_status"?: string | null,"id"?: string,"reason"?: string | null,"to_status": string
                  }
                  Update: {
                    "changed_by"?: string,"created_at"?: string,"event_id"?: string,"from_status"?: string | null,"id"?: string,"reason"?: string | null,"to_status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_status_history_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_status_history_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "club_events"
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
                },"membership_applications": {
                  Row: {
                    "answers": NonNullable<Json>,"applicant_id": string,"application_type": string,"club_id": string,"created_at": string,"decision_reason": string | null,"form_version": number,"id": string,"membership_id": string | null,"motivation": string,"reviewed_at": string | null,"reviewer_id": string | null,"status": string,"submitted_at": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"applicant_id": string,"application_type"?: string,"club_id": string,"created_at"?: string,"decision_reason"?: string | null,"form_version"?: number,"id"?: string,"membership_id"?: string | null,"motivation": string,"reviewed_at"?: string | null,"reviewer_id"?: string | null,"status"?: string,"submitted_at"?: string,"updated_at"?: string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"applicant_id"?: string,"application_type"?: string,"club_id"?: string,"created_at"?: string,"decision_reason"?: string | null,"form_version"?: number,"id"?: string,"membership_id"?: string | null,"motivation"?: string,"reviewed_at"?: string | null,"reviewer_id"?: string | null,"status"?: string,"submitted_at"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "membership_applications_applicant_id_fkey"
      columns: ["applicant_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_membership_id_fkey"
      columns: ["membership_id"]
isOneToOne: false
      referencedRelation: "club_memberships"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"membership_status_history": {
                  Row: {
                    "actor_id": string,"club_id": string,"created_at": string,"from_status": string | null,"id": string,"membership_id": string,"reason": string | null,"to_status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"club_id": string,"created_at"?: string,"from_status"?: string | null,"id"?: string,"membership_id": string,"reason"?: string | null,"to_status": string,"user_id": string
                  }
                  Update: {
                    "actor_id"?: string,"club_id"?: string,"created_at"?: string,"from_status"?: string | null,"id"?: string,"membership_id"?: string,"reason"?: string | null,"to_status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "membership_status_history_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_status_history_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_status_history_membership_id_fkey"
      columns: ["membership_id"]
isOneToOne: false
      referencedRelation: "club_memberships"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_status_history_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
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
            "accept_club_invitation":
{ Args: { "raw_token": string }; Returns: string
                           },
"archive_club_team":
{ Args: { "target_club_id": string,"target_team_id": string }; Returns: string
                           },
"archive_platform_role":
{ Args: { "reason": string,"target_role_id": string }; Returns: string
                           },
"assign_club_role":
{ Args: { "target_club_id": string,"target_role_id": string,"target_user_id": string }; Returns: string
                           },
"assign_platform_role":
{ Args: { "target_role_id": string,"target_user_id": string }; Returns: string
                           },
"cancel_event_registration":
{ Args: { "target_registration_id": string }; Returns: string
                           },
"create_club_event":
{ Args: { "capacity": number,"eligibility": string,"ends_at": string,"event_description": string,"event_location": string,"event_title": string,"event_type": string,"registration_deadline": string,"starts_at": string,"target_club_id": string,"visibility": string }; Returns: string
                           },
"create_club_invitation":
{ Args: { "expires_at": string,"raw_token": string,"recipient_email": string,"target_club_id": string }; Returns: string
                           },
"current_user_has_permission":
{ Args: { "permission_key": string,"scope_id"?: string,"scope_type": string }; Returns: boolean
                           },
"get_club_workspace":
{ Args: { "target_club_id": string }; Returns: {
              "can_manage_roles": boolean,"can_manage_settings": boolean,"can_manage_teams": boolean,"can_view_members": boolean,"club_description": string,"club_id": string,"club_name": string,"club_slug": string,"club_status": string,"club_visibility": string,"university_id": string,"university_name": string
            }[]
                           },
"list_assignable_club_roles":
{ Args: { "target_club_id": string }; Returns: {
              "role_description": string,"role_id": string,"role_key": string,"role_name": string
            }[]
                           },
"list_club_events":
{ Args: { "target_club_id": string }; Returns: {
              "approved_by": string,"capacity": number,"created_by": string,"creator_name": string,"description": string,"eligibility": string,"ends_at": string,"event_id": string,"event_type": string,"location": string,"registered_count": number,"registration_deadline": string,"starts_at": string,"status": string,"title": string,"visibility": string,"waitlisted_count": number
            }[]
                           },
"list_club_invitations":
{ Args: { "target_club_id": string }; Returns: {
              "created_at": string,"expires_at": string,"invitation_id": string,"invitation_status": string,"recipient_email": string
            }[]
                           },
"list_club_leadership":
{ Args: { "target_club_id": string }; Returns: {
              "assignment_id": string,"display_name": string,"email": string,"role_id": string,"role_key": string,"role_name": string,"starts_at": string,"user_id": string
            }[]
                           },
"list_club_members":
{ Args: { "target_club_id": string }; Returns: {
              "display_name": string,"email": string,"end_reason": string,"ended_at": string,"joined_at": string,"membership_id": string,"membership_status": string,"user_id": string,"valid_until": string
            }[]
                           },
"list_club_teams":
{ Args: { "target_club_id": string }; Returns: {
              "team_description": string,"team_id": string,"team_name": string,"team_status": string,"updated_at": string
            }[]
                           },
"list_discoverable_clubs":
{ Args: { "search_query"?: string }; Returns: {
              "application_status": string,"club_description": string,"club_id": string,"club_name": string,"club_slug": string,"membership_status": string,"university_id": string,"university_name": string
            }[]
                           },
"list_discoverable_events":
{ Args: Record<PropertyKey, never>; Returns: {
              "capacity": number,"club_id": string,"club_name": string,"description": string,"eligibility": string,"ends_at": string,"event_id": string,"event_type": string,"location": string,"registered_count": number,"registration_deadline": string,"registration_status": string,"starts_at": string,"title": string,"university_name": string,"waitlisted_count": number
            }[]
                           },
"list_event_registrations":
{ Args: { "target_event_id": string }; Returns: {
              "display_name": string,"email": string,"registered_at": string,"registration_id": string,"status": string,"user_id": string
            }[]
                           },
"list_grantable_platform_permissions":
{ Args: Record<PropertyKey, never>; Returns: {
              "description": string,"permission_key": string,"permission_name": string,"scope_type": string
            }[]
                           },
"list_manageable_clubs":
{ Args: Record<PropertyKey, never>; Returns: {
              "club_description": string,"club_id": string,"club_name": string,"club_slug": string,"club_status": string,"university_id": string
            }[]
                           },
"list_my_club_requests":
{ Args: Record<PropertyKey, never>; Returns: {
              "club_id": string,"decision_reason": string,"proposed_description": string,"proposed_name": string,"proposed_slug": string,"request_id": string,"request_type": string,"reviewed_at": string,"status": string,"submitted_at": string,"university_id": string,"university_name": string
            }[]
                           },
"list_my_club_workspaces":
{ Args: Record<PropertyKey, never>; Returns: {
              "can_manage": boolean,"club_description": string,"club_id": string,"club_name": string,"club_slug": string,"club_status": string,"club_visibility": string,"role_names": string,"university_id": string,"university_name": string
            }[]
                           },
"list_my_membership_applications":
{ Args: Record<PropertyKey, never>; Returns: {
              "answers": Json,"application_id": string,"application_type": string,"club_id": string,"club_name": string,"decision_reason": string,"membership_id": string,"motivation": string,"reviewed_at": string,"status": string,"submitted_at": string,"university_name": string
            }[]
                           },
"list_my_memberships":
{ Args: Record<PropertyKey, never>; Returns: {
              "club_id": string,"club_name": string,"joined_at": string,"membership_id": string,"membership_status": string,"university_name": string,"valid_until": string
            }[]
                           },
"list_platform_audit_events":
{ Args: { "page_limit"?: number }; Returns: {
              "action": string,"actor_email": string,"actor_id": string,"actor_name": string,"after_state": Json,"before_state": Json,"created_at": string,"event_id": string,"metadata": Json,"resource_id": string,"resource_type": string
            }[]
                           },
"list_platform_role_assignments":
{ Args: Record<PropertyKey, never>; Returns: {
              "assignment_id": string,"role_id": string,"role_name": string,"starts_at": string,"user_email": string,"user_id": string,"user_name": string
            }[]
                           },
"list_platform_roles":
{ Args: Record<PropertyKey, never>; Returns: {
              "active_assignment_count": number,"archived_at": string,"description": string,"is_system": boolean,"permission_keys": (string)[],"role_id": string,"role_key": string,"role_name": string
            }[]
                           },
"list_platform_users":
{ Args: { "page_limit"?: number,"page_offset"?: number,"search_query"?: string }; Returns: {
              "account_status": string,"created_at": string,"display_name": string,"email": string,"last_sign_in_at": string,"suspended_at": string,"suspension_reason": string,"user_id": string
            }[]
                           },
"list_reviewable_club_requests":
{ Args: Record<PropertyKey, never>; Returns: {
              "club_id": string,"decision_reason": string,"proposed_description": string,"proposed_name": string,"proposed_slug": string,"request_id": string,"request_type": string,"reviewed_at": string,"status": string,"submitted_at": string,"submitter_email": string,"submitter_id": string,"submitter_name": string,"university_id": string,"university_name": string
            }[]
                           },
"list_reviewable_membership_applications":
{ Args: { "target_club_id": string }; Returns: {
              "answers": Json,"applicant_email": string,"applicant_id": string,"applicant_name": string,"application_id": string,"application_type": string,"decision_reason": string,"membership_id": string,"motivation": string,"reviewed_at": string,"status": string,"submitted_at": string
            }[]
                           },
"list_university_staff":
{ Args: { "target_university_id": string }; Returns: {
              "assignment_id": string,"display_name": string,"email": string,"ends_at": string,"scope_id": string,"scope_type": string,"staff_type": string,"starts_at": string,"status": string,"title": string,"updated_at": string,"user_id": string
            }[]
                           },
"lookup_club_role_candidate":
{ Args: { "email_query": string,"target_club_id": string }; Returns: {
              "display_name": string,"email": string,"user_id": string
            }[]
                           },
"lookup_university_staff_candidate":
{ Args: { "email_query": string,"target_university_id": string }; Returns: {
              "display_name": string,"email": string,"user_id": string
            }[]
                           },
"mark_event_attendance":
{ Args: { "attendance_status": string,"reason": string,"target_registration_id": string }; Returns: undefined
                           },
"register_for_event":
{ Args: { "target_event_id": string }; Returns: string
                           },
"resign_membership":
{ Args: { "reason": string,"target_membership_id": string }; Returns: string
                           },
"revoke_club_invitation":
{ Args: { "target_invitation_id": string }; Returns: string
                           },
"revoke_club_role":
{ Args: { "reason": string,"target_assignment_id": string,"target_club_id": string }; Returns: string
                           },
"revoke_platform_role_assignment":
{ Args: { "reason": string,"target_assignment_id": string }; Returns: string
                           },
"save_club_team":
{ Args: { "target_club_id": string,"target_team_id": string,"team_description": string,"team_name": string }; Returns: string
                           },
"save_platform_role":
{ Args: { "requested_permission_keys": (string)[],"role_description": string,"role_key": string,"role_name": string,"target_role_id": string }; Returns: string
                           },
"set_user_account_status":
{ Args: { "new_status": string,"reason": string,"target_user_id": string }; Returns: string
                           },
"submit_club_request":
{ Args: { "proposed_description": string,"proposed_name": string,"proposed_slug": string,"request_type": string,"target_club_id": string,"target_university_id": string }; Returns: string
                           },
"submit_membership_application":
{ Args: { "answers": Json,"application_type": string,"motivation": string,"target_club_id": string,"target_membership_id": string }; Returns: string
                           },
"transition_club_event":
{ Args: { "new_status": string,"reason"?: string,"target_event_id": string }; Returns: undefined
                           },
"transition_club_request":
{ Args: { "new_status": string,"reason": string,"target_request_id": string }; Returns: string
                           },
"transition_membership_application":
{ Args: { "new_status": string,"reason": string,"target_application_id": string }; Returns: string
                           },
"transition_membership_status":
{ Args: { "new_status": string,"reason": string,"target_membership_id": string }; Returns: string
                           },
"update_club_event":
{ Args: { "capacity": number,"eligibility": string,"ends_at": string,"event_description": string,"event_location": string,"event_title": string,"event_type": string,"registration_deadline": string,"starts_at": string,"target_event_id": string,"visibility": string }; Returns: undefined
                           },
"withdraw_membership_application":
{ Args: { "target_application_id": string }; Returns: string
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
