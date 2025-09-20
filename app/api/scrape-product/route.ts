import { NextRequest, NextResponse } from 'next/server'
import { ProductMetadata } from '@/types'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'no,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
      })
      
      if (response.ok) {
        return response
      }
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error('Failed to fetch after retries')
}

function extractMetadata(html: string, url: string): ProductMetadata {
  const metadata: ProductMetadata = {
    title: '',
    price: undefined,
    image: undefined,
    description: undefined,
    siteName: undefined,
  }

  // Open Graph tags
  const ogTitle = html.match(/<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i)
  const ogDescription = html.match(/<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i)
  const ogImage = html.match(/<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i)
  const ogSiteName = html.match(/<meta[^>]*property=["\']og:site_name["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i)

  // Twitter Card tags
  const twitterTitle = html.match(/<meta[^>]*name=["\']twitter:title["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i)
  const twitterDescription = html.match(/<meta[^>]*name=["\']twitter:description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i)
  const twitterImage = html.match(/<meta[^>]*name=["\']twitter:image["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i)

  // Standard HTML tags
  const htmlTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const metaDescription = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i)

  // Sett tittel
  metadata.title = ogTitle?.[1] || twitterTitle?.[1] || htmlTitle?.[1]?.trim() || ''

  // Sett beskrivelse
  metadata.description = ogDescription?.[1] || twitterDescription?.[1] || metaDescription?.[1] || ''

  // Sett bilde
  metadata.image = ogImage?.[1] || twitterImage?.[1] || ''

  // Sett nettstedsnavn
  metadata.siteName = ogSiteName?.[1] || ''

  // Spesifikke prisextraksjoner for norske butikker
  const hostname = new URL(url).hostname.toLowerCase()
  
  if (hostname.includes('elkjop.no')) {
    // Elkjøp spesifikke patterns
    const elkjøpPrice = html.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                       html.match(/"price":\s*"([^"]+)"/i) ||
                       html.match(/data-price="([^"]+)"/i)
    if (elkjøpPrice) {
      const priceStr = elkjøpPrice[1].replace(/[^\d,]/g, '').replace(',', '.')
      const price = parseFloat(priceStr)
      if (price > 0) metadata.price = price
    }
  } else if (hostname.includes('komplett.no')) {
    // Komplett spesifikke patterns
    const komplettPrice = html.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                         html.match(/"price":\s*"([^"]+)"/i) ||
                         html.match(/data-testid="price"[^>]*>([^<]+)</i)
    if (komplettPrice) {
      const priceStr = komplettPrice[1].replace(/[^\d,]/g, '').replace(',', '.')
      const price = parseFloat(priceStr)
      if (price > 0) metadata.price = price
    }
  } else if (hostname.includes('power.no')) {
    // Power spesifikke patterns
    const powerPrice = html.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                      html.match(/"price":\s*"([^"]+)"/i) ||
                      html.match(/data-price="([^"]+)"/i)
    if (powerPrice) {
      const priceStr = powerPrice[1].replace(/[^\d,]/g, '').replace(',', '.')
      const price = parseFloat(priceStr)
      if (price > 0) metadata.price = price
    }
  } else {
    // Generelle prispatterns
    const pricePatterns = [
      /(?:kr|kroner|price["\'][^>]*>|pris["\'][^>]*>)[\s]*([0-9]{1,3}(?:[.\s][0-9]{3})*(?:,[0-9]{2})?)/gi,
      /([0-9]{1,3}(?:[.\s][0-9]{3})*(?:,[0-9]{2})?)[\s]*(?:kr|kroner)/gi,
      /"price":\s*"?([0-9]+(?:\.[0-9]{2})?)"?/gi,
      /data-price["\'][^>]*["\']([0-9]+(?:\.[0-9]{2})?)["\']/gi,
    ]

    for (const pattern of pricePatterns) {
      const matches = Array.from(html.matchAll(pattern))
      for (const match of matches) {
        let priceStr = match[1]
        if (priceStr) {
          priceStr = priceStr.replace(/[\s.]/g, '').replace(',', '.')
          const price = parseFloat(priceStr)
          if (price > 0 && price < 1000000) {
            metadata.price = price
            break
          }
        }
      }
      if (metadata.price) break
    }
  }

  // Bestem butikknavn fra URL
  if (!metadata.siteName) {
    if (hostname.includes('elkjop.no')) metadata.siteName = 'Elkjøp'
    else if (hostname.includes('komplett.no')) metadata.siteName = 'Komplett'
    else if (hostname.includes('power.no')) metadata.siteName = 'Power'
    else if (hostname.includes('expert.no')) metadata.siteName = 'Expert'
    else if (hostname.includes('eplehuset.no')) metadata.siteName = 'Eplehuset'
    else if (hostname.includes('amazon')) metadata.siteName = 'Amazon'
    else metadata.siteName = hostname
  }

  return metadata
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Ugyldig URL' },
        { status: 400 }
      )
    }

    // Valider URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Ugyldig URL format' },
        { status: 400 }
      )
    }

    // Støttede domener
    const supportedDomains = [
      'elkjop.no',
      'komplett.no',
      'power.no',
      'expert.no',
      'eplehuset.no',
      'amazon.com',
      'amazon.no',
      'prisguiden.no',
      'prisjakt.no',
    ]

    const isSupported = supportedDomains.some(domain => 
      validUrl.hostname.includes(domain)
    )

    if (!isSupported) {
      return NextResponse.json(
        { error: 'Nettstedet støttes ikke ennå' },
        { status: 400 }
      )
    }

    // Hent siden
    const response = await fetchWithRetry(url)
    const html = await response.text()

    // Trekk ut metadata
    const metadata = extractMetadata(html, url)

    if (!metadata.title) {
      return NextResponse.json(
        { error: 'Kunne ikke finne produktinformasjon' },
        { status: 400 }
      )
    }

    return NextResponse.json(metadata)

  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente produktinformasjon' },
      { status: 500 }
    )
  }
}