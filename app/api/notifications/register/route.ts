import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Opprett Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Sjekk om miljøvariabler er satt
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { message: 'Server ikke konfigurert' },
        { status: 500 }
      )
    }

    // Hent bruker fra Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Mangler autorisasjon' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Opprett ny Supabase client med riktige miljøvariabler
    const supabaseAdminReal = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verifiser token og hent bruker
    const { data: { user }, error: authError } = await supabaseAdminReal.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Ugyldig autorisasjon' },
        { status: 401 }
      )
    }

    const { token: pushToken } = await request.json()

    if (!pushToken) {
      return NextResponse.json(
        { message: 'Mangler push token' },
        { status: 400 }
      )
    }

    // Lagre push token i databasen
    const { error: insertError } = await supabaseAdminReal
      .from('push_tokens')
      .upsert({
        user_id: user.id,
        token: pushToken,
        platform: 'ios', // eller 'android' basert på user agent
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error saving push token:', insertError)
      return NextResponse.json(
        { message: 'Kunne ikke lagre push token' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Push token registrert' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error in push token registration:', error)
    return NextResponse.json(
      { message: 'En uventet feil oppstod. Prøv igjen senere.' },
      { status: 500 }
    )
  }
}
