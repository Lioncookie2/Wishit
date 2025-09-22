import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Opprett Supabase admin client for konto-sletting
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

export async function DELETE(request: NextRequest) {
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

    const userId = user.id

    // Start en transaksjon for å slette alle relaterte data
    const { error: deleteError } = await supabaseAdminReal.rpc('delete_user_account', {
      user_id: userId
    })

    if (deleteError) {
      console.error('Error deleting user account:', deleteError)
      return NextResponse.json(
        { message: 'Kunne ikke slette konto. Prøv igjen senere.' },
        { status: 500 }
      )
    }

    // Slett brukeren fra Supabase Auth
    const { error: deleteUserError } = await supabaseAdminReal.auth.admin.deleteUser(userId)
    
    if (deleteUserError) {
      console.error('Error deleting user from auth:', deleteUserError)
      // Fortsett selv om auth-sletting feiler, siden dataene er slettet
    }

    // Send bekreftelsesmail (valgfritt)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-deletion-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          full_name: user.user_metadata?.full_name || 'Bruker'
        })
      })
    } catch (emailError) {
      console.error('Error sending deletion confirmation email:', emailError)
      // Fortsett selv om e-post feiler
    }

    return NextResponse.json(
      { message: 'Konto slettet vellykket' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error in account deletion:', error)
    return NextResponse.json(
      { message: 'En uventet feil oppstod. Prøv igjen senere.' },
      { status: 500 }
    )
  }
}
