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
  price?: number
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
