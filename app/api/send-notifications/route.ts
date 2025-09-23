import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Hent alle ønsker med prisfall som ikke har fått varsel
    const { data: priceDrops, error: fetchError } = await supabase
      .from('wishlists')
      .select(`
        id,
        title,
        current_price,
        previous_price,
        user_id,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq('price_drop_notification_sent', false)
      .not('current_price', 'is', null)
      .not('previous_price', 'is', null)
      .lt('current_price', 'previous_price')

    if (fetchError) {
      console.error('Error fetching price drops:', fetchError)
      return NextResponse.json({ error: 'Kunne ikke hente prisfall' }, { status: 500 })
    }

    if (!priceDrops || priceDrops.length === 0) {
      return NextResponse.json({ message: 'Ingen prisfall å varsle om' })
    }

    const results = {
      notificationsSent: 0,
      errors: 0
    }

    // Send varsler for hver prisfall
    for (const priceDrop of priceDrops) {
      try {
        const priceDropItem = priceDrop as any
        const priceDifference = priceDropItem.previous_price - priceDropItem.current_price
        const percentageDrop = Math.round((priceDifference / priceDropItem.previous_price) * 100)

        // Opprett notifikasjon i databasen
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: priceDropItem.user_id,
            type: 'price_drop',
            title: 'Prisfall! 🔥',
            message: `${priceDropItem.title} har falt med ${priceDifference} kr (${percentageDrop}%) - nå kun ${priceDropItem.current_price} kr`,
            data: {
              product: priceDropItem.title,
              originalPrice: priceDropItem.previous_price,
              newPrice: priceDropItem.current_price,
              savings: priceDifference,
              percentage: percentageDrop
            },
            read: false
          })

        if (notificationError) {
          console.error(`Error creating notification for ${priceDropItem.id}:`, notificationError)
          results.errors++
          continue
        }

        // Log til konsollen for debugging
        console.log(`🔔 Prisfall-varsel opprettet: "${priceDropItem.title}"`)
        console.log(`   Bruker: ${priceDropItem.profiles?.full_name || priceDropItem.profiles?.email}`)
        console.log(`   Tidligere pris: ${priceDropItem.previous_price} kr`)
        console.log(`   Ny pris: ${priceDropItem.current_price} kr`)
        console.log(`   Besparelse: ${priceDifference} kr (${percentageDrop}%)`)
        console.log(`   ---`)

        // Oppdater at varsel er sendt
        const { error: updateError } = await supabase
          .from('wishlists')
          .update({
            price_drop_notification_sent: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', priceDropItem.id)

        if (updateError) {
          console.error(`Error updating notification status for ${priceDropItem.id}:`, updateError)
          results.errors++
        } else {
          results.notificationsSent++
        }

      } catch (error) {
        console.error(`Error processing price drop ${(priceDrop as any).id}:`, error)
        results.errors++
      }
    }

    return NextResponse.json({
      message: 'Varsler sendt',
      results
    })

  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke sende varsler' },
      { status: 500 }
    )
  }
}

// GET endpoint for å teste varsler
export async function GET() {
  return NextResponse.json({
    message: 'Push-varsel API er tilgjengelig',
    usage: 'Send POST request for å sende varsler'
  })
}
