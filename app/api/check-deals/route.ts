import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Dette er en mockup av tilbudsjekking - i virkeligheten ville dette integrere med Prisjakt API eller lignende
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Sjekk autentisering
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 })
    }

    // Sjekk om bruker har premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    if (!profile?.is_premium) {
      return NextResponse.json({ error: 'Premium påkrevd' }, { status: 403 })
    }

    // Hent brukerens ønskelister
    const { data: wishlists } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_purchased', false)

    if (!wishlists) {
      return NextResponse.json({ deals: [] })
    }

    // Mockup av tilbudssjekking
    const dealsFound = []
    
    for (const wishlist of wishlists) {
      // I virkeligheten ville vi sjekke mot Prisjakt eller lignende API
      // For nå lager vi mockdata
      const isOnSale = Math.random() > 0.8 // 20% sjanse for tilbud
      
      if (isOnSale) {
        const originalPrice = wishlist.price || 1000
        const salePrice = Math.floor(originalPrice * (0.7 + Math.random() * 0.2)) // 10-30% rabatt
        const discount = originalPrice - salePrice
        
        dealsFound.push({
          wishlist_id: wishlist.id,
          title: wishlist.title,
          original_price: originalPrice,
          sale_price: salePrice,
          discount_amount: discount,
          discount_percentage: Math.round((discount / originalPrice) * 100),
          store_name: wishlist.store_name || 'Ukjent butikk',
          url: wishlist.url,
        })
      }
    }

    return NextResponse.json({ deals: dealsFound })

  } catch (error) {
    console.error('Feil ved tilbudssjekking:', error)
    return NextResponse.json(
      { error: 'Kunne ikke sjekke tilbud' },
      { status: 500 }
    )
  }
}

// Planlagt jobb for å sjekke tilbud (ville kjøres via cron job)
export async function GET() {
  try {
    // Dette ville normalt kjøres som en scheduled job
    // For nå returnerer vi bare status
    return NextResponse.json({ 
      message: 'Tilbudssjekking er aktivert',
      next_check: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 time
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Feil ved planlagt tilbudssjekking' },
      { status: 500 }
    )
  }
}
