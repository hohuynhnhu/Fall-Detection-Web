export interface User {
  id: string
  email: string
  display_name: string
  role: string
  is_active: boolean
  created_at: string
  avatar_url?: string
  phone?: string
  phone_number?: string
}

export interface FallEvent {
  id: string
  camera_id?: string
  confidence: number | null
  timestamp?: string | number
  created_at?: string
  datetime_vn?: string
  velocity?: number | null
  angle?: number | null
  user_name?: string
  user_email?: string
  display_name?: string
  email?: string
  location?: string
  notes?: string
  state_before?: string
  clip_url?: string
}

export interface Report {
  id: string
  user_name?: string
  display_name?: string
  user_email?: string
  email?: string
  category?: string
  content?: string
  message?: string
  status: string
  created_at: string
  admin_reply?: string
}

export interface StatsOverview {
  total_users: number
  active_users: number
  total_falls_today: number
  total_falls_this_month: number
  total_falls_all_time: number
}

export interface TimelinePoint {
  date: string
  count: number
}

export interface TimelineResponse {
  labels: string[]
  counts: number[]
}

export interface HealthStatus {
  status: string
  [key: string]: unknown
}

export interface FamilyMember {
  id: string
  name?: string
  display_name?: string
  email?: string
  relationship?: string
}

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship?: string
}

export interface UserProfile {
  user: User
  family_members?: FamilyMember[]
  emergency_contacts?: EmergencyContact[]
}

export interface UserListResponse {
  users?: User[]
  items?: User[]
  total: number
}

export interface FallListResponse {
  falls?: FallEvent[]
  items?: FallEvent[]
  total: number
}

export interface ReportListResponse {
  reports?: Report[]
  items?: Report[]
  total: number
}
