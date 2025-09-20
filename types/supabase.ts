export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          admin_id: string
          budget: number | null
          budget_per_member: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          admin_id: string
          budget?: number | null
          budget_per_member?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          admin_id?: string
          budget?: number | null
          budget_per_member?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          group_id: string | null
          title: string
          description: string | null
          url: string
          price: number | null
          image_url: string | null
          store_name: string | null
          is_purchased: boolean
          purchased_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id?: string | null
          title: string
          description?: string | null
          url: string
          price?: number | null
          image_url?: string | null
          store_name?: string | null
          is_purchased?: boolean
          purchased_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string | null
          title?: string
          description?: string | null
          url?: string
          price?: number | null
          image_url?: string | null
          store_name?: string | null
          is_purchased?: boolean
          purchased_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          group_id: string
          email: string
          invited_by: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          group_id: string
          email: string
          invited_by: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          email?: string
          invited_by?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          expires_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
