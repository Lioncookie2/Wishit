import { supabase } from './supabase'
import { AuthError, User } from '@supabase/supabase-js'

export interface AuthResponse {
  user?: User
  error?: AuthError | Error
}

export const authService = {
  async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) return { error }

      // Opprett profil i profiles tabell
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
            is_premium: false,
          } as any)

        if (profileError) {
          console.error('Feil ved opprettelse av profil:', profileError)
        }
      }

      return { user: data.user || undefined }
    } catch (error) {
      return { error: error as Error }
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { error }
      return { user: data.user }
    } catch (error) {
      return { error: error as Error }
    }
  },

  async signOut(): Promise<{ error?: AuthError }> {
    const { error } = await supabase.auth.signOut()
    return { error: error || undefined }
  },

  async resetPassword(email: string): Promise<{ error?: AuthError }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error || undefined }
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null)
    })
  },
}
