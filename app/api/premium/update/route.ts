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

    const { isPremium, transactionId, couponCode, userId } = await request.json()

    if (typeof isPremium !== 'boolean') {
      return NextResponse.json(
        { message: 'Ugyldig premium-status' },
        { status: 400 }
      )
    }

    // Hvis det er en kupongkode, valider den
    if (couponCode) {
      const validCoupons = ['Premium2025', 'Wishit2025', 'Test123']
      if (!validCoupons.includes(couponCode)) {
        return NextResponse.json(
          { error: 'Ugyldig kupongkode' },
          { status: 400 }
        )
      }
    }

    // Hent bruker fra Authorization header eller userId
    let user
    if (userId) {
      // For kupongkoder, bruk userId direkte
      user = { id: userId }
    } else {
      // For vanlige kjøp, bruk Authorization header
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
      const { data: { user: authUser }, error: authError } = await supabaseAdminReal.auth.getUser(token)
      
      if (authError || !authUser) {
        return NextResponse.json(
          { message: 'Ugyldig autorisasjon' },
          { status: 401 }
        )
      }
      
      user = authUser
    }
    
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

    // Oppdater premium-status i profiles tabell
    const { error: updateError } = await supabaseAdminReal
      .from('profiles')
      .update({ 
        is_premium: isPremium,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating premium status:', updateError)
      return NextResponse.json(
        { message: 'Kunne ikke oppdatere premium-status' },
        { status: 500 }
      )
    }

    // Log transaksjonen (valgfritt)
    if (transactionId) {
      try {
        await supabaseAdminReal
          .from('premium_transactions')
          .insert({
            user_id: user.id,
            transaction_id: transactionId,
            is_premium: isPremium,
            coupon_code: couponCode || null,
            created_at: new Date().toISOString()
          })
      } catch (logError) {
        console.error('Error logging transaction:', logError)
        // Fortsett selv om logging feiler
      }
    }

    return NextResponse.json(
      { 
        message: 'Premium-status oppdatert',
        isPremium 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error in premium update:', error)
    return NextResponse.json(
      { message: 'En uventet feil oppstod. Prøv igjen senere.' },
      { status: 500 }
    )
  }
}
