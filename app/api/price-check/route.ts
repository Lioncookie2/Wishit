import { NextRequest, NextResponse } from 'next/server'

interface PriceCheckResult {
  store: string
  price: number
  url: string
  inStock: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { productName, currentPrice } = await request.json()

    if (!productName) {
      return NextResponse.json(
        { error: 'Produktnavn er påkrevd' },
        { status: 400 }
      )
    }

    // Simuler prisjakt-søk (i virkeligheten ville dette kalle Prisjakt API)
    const mockResults: PriceCheckResult[] = [
      {
        store: 'Elkjøp',
        price: currentPrice ? Math.floor(currentPrice * 0.85) : 999,
        url: 'https://www.elkjop.no',
        inStock: true
      },
      {
        store: 'Komplett',
        price: currentPrice ? Math.floor(currentPrice * 0.92) : 1099,
        url: 'https://www.komplett.no',
        inStock: true
      },
      {
        store: 'Power',
        price: currentPrice ? Math.floor(currentPrice * 0.88) : 1049,
        url: 'https://www.power.no',
        inStock: false
      }
    ]

    // Sorter etter pris
    const sortedResults = mockResults
      .filter(result => result.inStock)
      .sort((a, b) => a.price - b.price)

    const bestPrice = sortedResults[0]
    const savings = currentPrice && bestPrice ? currentPrice - bestPrice.price : 0

    return NextResponse.json({
      bestPrice,
      allPrices: sortedResults,
      savings,
      hasBetterPrice: savings > 0
    })

  } catch (error) {
    console.error('Price check error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke sjekke priser' },
      { status: 500 }
    )
  }
}
