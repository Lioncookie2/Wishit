import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Hent alle ønsker med prisdata fra alle grupper brukeren er medlem av
    const { data: wishlists, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        title,
        current_price,
        previous_price,
        last_price_check,
        image_url,
        url,
        created_at,
        profiles!wishlists_user_id_fkey (
          display_name
        ),
        groups!wishlists_group_id_fkey (
          name
        )
      `)
      .not('current_price', 'is', null)
      .order('last_price_check', { ascending: false })

    if (error) {
      console.error('Error fetching price data:', error)
      return NextResponse.json({ error: 'Kunne ikke hente prisdata' }, { status: 500 })
    }

    // Beregn prisendringer
    const priceItems = wishlists?.map((item: any) => {
      const currentPrice = item.current_price || 0
      const previousPrice = item.previous_price || currentPrice
      const priceChange = currentPrice - previousPrice
      const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0

      return {
        id: item.id,
        title: item.title,
        currentPrice,
        previousPrice: previousPrice !== currentPrice ? previousPrice : undefined,
        priceChange,
        priceChangePercent,
        lastUpdated: item.last_price_check || item.created_at,
        imageUrl: item.image_url,
        productUrl: item.url,
        owner: item.profiles?.display_name || 'Ukjent',
        groupName: item.groups?.name || 'Ukjent gruppe'
      }
    }) || []

    return NextResponse.json({ priceItems })

  } catch (error) {
    console.error('Price overview error:', error)
    return NextResponse.json({ error: 'En uventet feil oppstod' }, { status: 500 })
  }
}
