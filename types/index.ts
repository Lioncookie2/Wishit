export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  is_premium: boolean
}

export interface Group {
  id: string
  name: string
  description?: string
  admin_id: string
  budget?: number
  budget_per_member?: number
  join_code?: string
  mystery_gift_enabled?: boolean
  mystery_gift_budget?: number
  created_at: string
  members?: GroupMember[]
  wishlistCount?: number
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  profile?: User
}

export interface WishlistItem {
  id: string
  user_id: string
  group_id?: string
  title: string
  description?: string
  url: string
  price?: number // Gamle feltet for bakoverkompatibilitet
  current_price?: number // Nåværende pris
  previous_price?: number // Tidligere pris for prisfall-deteksjon
  price_provider?: string // Kilde for prisdata
  last_price_check?: string // Når prisen sist ble sjekket
  price_drop_notification_sent?: boolean // Om prisfall-varsel er sendt
  contributions?: Contribution[] // Bidrag til ønsket
  total_contributed?: number // Totalt bidrag
  is_fully_funded?: boolean // Om ønsket er fullfinansiert
  image_url?: string
  store_name?: string
  is_purchased: boolean
  purchased_by?: string
  purchased_at?: string
  purchase_comment?: string
  thank_you_message?: string
  created_at: string
  updated_at: string
  owner?: User
  purchaser?: User
}

export interface Contribution {
  userId: string
  amount: number
  comment: string
  userName: string
  createdAt: string
}

export interface Invitation {
  id: string
  group_id: string
  email: string
  invited_by: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  expires_at: string
  group?: Group
  inviter?: User
}

export interface ProductMetadata {
  title: string
  price?: number
  image?: string
  description?: string
  siteName?: string
}
