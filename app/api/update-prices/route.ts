import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Hent alle ønsker som trenger prisoppdatering
    const { data: wishlists, error: fetchError } = await supabase
      .from('wishlists')
      .select('id, url, current_price, previous_price, price_provider')
      .not('url', 'is', null)
      .or('last_price_check.is.null,last_price_check.lt.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (fetchError) {
      console.error('Error fetching wishlists:', fetchError)
      return NextResponse.json({ error: 'Kunne ikke hente ønsker' }, { status: 500 })
    }

    if (!wishlists || wishlists.length === 0) {
      return NextResponse.json({ message: 'Ingen ønsker trenger prisoppdatering' })
    }

    const results = {
      updated: 0,
      errors: 0,
      priceDrops: 0
    }

    // Oppdater priser for hver ønskeliste
    for (const wishlist of wishlists) {
      const wishlistItem = wishlist as any
      try {
        // Hent ny pris fra URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/scrape-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: wishlistItem.url }),
        })

        if (!response.ok) {
          console.error(`Failed to scrape price for ${wishlistItem.url}`)
          results.errors++
          continue
        }

        const data = await response.json()
        const newPrice = data.current_price

        if (!newPrice || newPrice <= 0) {
          console.error(`Invalid price for ${wishlistItem.url}: ${newPrice}`)
          results.errors++
          continue
        }

        // Sjekk om det er prisfall
        const isPriceDrop = wishlistItem.current_price && newPrice < wishlistItem.current_price

        // Oppdater databasen
        const { error: updateError } = await (supabase
          .from('wishlists') as any)
          .update({
            previous_price: wishlistItem.current_price,
            current_price: newPrice,
            last_price_check: new Date().toISOString(),
            price_drop_notification_sent: isPriceDrop ? false : wishlistItem.price_drop_notification_sent,
            updated_at: new Date().toISOString()
          })
          .eq('id', wishlistItem.id)

        if (updateError) {
          console.error(`Error updating wishlist ${wishlistItem.id}:`, updateError)
          results.errors++
        } else {
          results.updated++
          if (isPriceDrop) {
            results.priceDrops++
          }
        }

        // Legg til liten delay for å unngå rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Error processing wishlist ${wishlistItem.id}:`, error)
        results.errors++
      }
    }

    // Send varsler for prisfall
    if (results.priceDrops > 0) {
      try {
        const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (notificationResponse.ok) {
          const notificationData = await notificationResponse.json()
          console.log('Varsler sendt:', notificationData)
        }
      } catch (error) {
        console.error('Error sending notifications:', error)
      }
    }

    return NextResponse.json({
      message: 'Prisoppdatering fullført',
      results
    })

  } catch (error) {
    console.error('Price update error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke oppdatere priser' },
      { status: 500 }
    )
  }
}

// GET endpoint for å teste prisoppdatering
export async function GET() {
  return NextResponse.json({
    message: 'Prisoppdatering API er tilgjengelig',
    usage: 'Send POST request for å oppdatere priser'
  })
}
