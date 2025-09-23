import { NextRequest, NextResponse } from 'next/server'
import { ProductMetadata } from '@/types'
import { scrapingRateLimiter, getRateLimitHeaders } from '@/lib/rate-limiter'
import { productCache, CacheKeys } from '@/lib/cache'

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

function extractPriceFromPatterns(html: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern))
    for (const match of matches) {
      let priceStr = match[1]
      if (priceStr) {
        // Rydd opp i pristekst
        priceStr = priceStr
          .replace(/[^\d,.-]/g, '') // Fjern alt som ikke er tall, komma, punktum eller bindestrek
          .replace(/,/g, '.') // Konverter komma til punktum
          .replace(/\.(?=\d*\.)/g, '') // Fjern alle punktum unntatt det siste (for tusen-separator)
        
        const price = parseFloat(priceStr)
        if (price > 0 && price < 1000000) { // Rimelig prisrange
          return price
        }
      }
    }
  }
  return undefined
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

  // Avanserte prisextraksjoner for alle nettsider
  const hostname = new URL(url).hostname.toLowerCase()
  
  // Først prøv JSON-LD structured data
  const jsonLdMatch = html.match(/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is)
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1])
      if (jsonLd.offers?.price) {
        const price = parseFloat(jsonLd.offers.price)
        if (price > 0) metadata.price = price
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  // Hvis ikke funnet i JSON-LD, prøv spesifikke patterns per nettsted
  if (!metadata.price) {
    if (hostname.includes('elkjop.no')) {
      const elkjøpPatterns = [
        /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/i,
        /"price":\s*"([^"]+)"/i,
        /data-price="([^"]+)"/i,
        /<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i
      ]
      metadata.price = extractPriceFromPatterns(html, elkjøpPatterns)
    } else if (hostname.includes('komplett.no')) {
      const komplettPatterns = [
        /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/i,
        /"price":\s*"([^"]+)"/i,
        /data-testid="price"[^>]*>([^<]+)</i,
        /<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i
      ]
      metadata.price = extractPriceFromPatterns(html, komplettPatterns)
    } else if (hostname.includes('power.no')) {
      const powerPatterns = [
        /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/i,
        /"price":\s*"([^"]+)"/i,
        /data-price="([^"]+)"/i,
        /<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i
      ]
      metadata.price = extractPriceFromPatterns(html, powerPatterns)
    } else if (hostname.includes('amazon')) {
      const amazonPatterns = [
        /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)<\/span>/i,
        /<span[^>]*id="priceblock_dealprice"[^>]*>([^<]+)<\/span>/i,
        /<span[^>]*id="priceblock_ourprice"[^>]*>([^<]+)<\/span>/i,
        /"price":\s*"([^"]+)"/i
      ]
      metadata.price = extractPriceFromPatterns(html, amazonPatterns)
    } else {
      // Generelle prispatterns for alle andre nettsider
      const generalPatterns = [
        // JSON-LD patterns
        /"price":\s*"?([0-9]+(?:\.[0-9]{2})?)"?/gi,
        /"offers":\s*\{[^}]*"price":\s*"?([0-9]+(?:\.[0-9]{2})?)"?/gi,
        
        // Meta tag patterns
        /<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i,
        /<meta[^>]*name="price"[^>]*content="([^"]+)"/i,
        
        // HTML patterns
        /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/i,
        /<div[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/div>/i,
        /<p[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/p>/i,
        
        // Data attribute patterns
        /data-price["\'][^>]*["\']([0-9]+(?:\.[0-9]{2})?)["\']/gi,
        /data-testid="price"[^>]*>([^<]+)</i,
        
        // Norske valuta patterns
        /(?:kr|kroner|price["\'][^>]*>|pris["\'][^>]*>)[\s]*([0-9]{1,3}(?:[.\s][0-9]{3})*(?:,[0-9]{2})?)/gi,
        /([0-9]{1,3}(?:[.\s][0-9]{3})*(?:,[0-9]{2})?)[\s]*(?:kr|kroner)/gi,
        
        // Generelle valuta patterns
        /(?:€|EUR|USD|\$|£|GBP)[\s]*([0-9]+(?:\.[0-9]{2})?)/gi,
        /([0-9]+(?:\.[0-9]{2})?)[\s]*(?:€|EUR|USD|\$|£|GBP)/gi,
        
        // Numeriske patterns
        /([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{2})?)/g
      ]
      
      metadata.price = extractPriceFromPatterns(html, generalPatterns)
    }
  }

  // Bestem butikknavn fra URL eller Open Graph
  if (!metadata.siteName) {
    const knownStores: { [key: string]: string } = {
      'elkjop.no': 'Elkjøp',
      'komplett.no': 'Komplett',
      'power.no': 'Power',
      'expert.no': 'Expert',
      'eplehuset.no': 'Eplehuset',
      'amazon.com': 'Amazon',
      'amazon.no': 'Amazon',
      'amazon.co.uk': 'Amazon UK',
      'amazon.de': 'Amazon DE',
      'prisguiden.no': 'Prisguiden',
      'prisjakt.no': 'Prisjakt',
      'finn.no': 'Finn.no',
      'hygglo.no': 'Hygglo',
      'ikea.com': 'IKEA',
      'ikea.no': 'IKEA',
      'clasohlson.no': 'Clas Ohlson',
      'xxl.no': 'XXL',
      'sport1.no': 'Sport1',
      'g-sport.no': 'G-Sport',
      'hifiklubben.no': 'Hifiklubben',
      'cdon.no': 'CDON',
      'netonnet.no': 'NetOnNet',
      'dustin.no': 'Dustin',
      'proshop.no': 'Proshop',
      'maxgaming.no': 'MaxGaming',
      'komplett.no': 'Komplett',
      'coolshop.no': 'Coolshop',
      'zara.com': 'Zara',
      'h&m.com': 'H&M',
      'hm.com': 'H&M',
      'zalando.no': 'Zalando',
      'zalando.com': 'Zalando',
      'asos.com': 'ASOS',
      'boozt.com': 'Boozt',
      'boozt.no': 'Boozt'
    }

    // Sjekk kjente butikker
    for (const [domain, storeName] of Object.entries(knownStores)) {
      if (hostname.includes(domain)) {
        metadata.siteName = storeName
        break
      }
    }

    // Hvis ikke funnet, bruk hostname
    if (!metadata.siteName) {
      metadata.siteName = hostname.replace('www.', '')
    }
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

    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    if (!scrapingRateLimiter.isAllowed(clientIP)) {
      return NextResponse.json(
        { error: 'For mange forespørsler. Prøv igjen senere.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(clientIP, scrapingRateLimiter)
        }
      )
    }

    // Sjekk cache først
    const cacheKey = CacheKeys.PRODUCT(url)
    const cachedData = productCache.get(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
          ...getRateLimitHeaders(clientIP, scrapingRateLimiter)
        }
      })
    }

    // Sjekk at URL er gyldig og ikke er en fil eller ugyldig type
    const invalidExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mp3', '.zip', '.exe']
    const hasInvalidExtension = invalidExtensions.some(ext => 
      validUrl.pathname.toLowerCase().endsWith(ext)
    )

    if (hasInvalidExtension) {
      return NextResponse.json(
        { error: 'Denne filtypen støttes ikke. Vennligst bruk en produkt-URL.' },
        { status: 400 }
      )
    }

    // Hent siden med feilhåndtering
    let response: Response
    let html: string
    
    try {
      response = await fetchWithRetry(url)
      html = await response.text()
    } catch (error) {
      console.error('Scraping fetch error:', error)
      return NextResponse.json(
        { error: 'Kunne ikke hente produktinformasjon. Nettstedet kan være utilgjengelig eller blokkere forespørsler.' },
        { 
          status: 503,
          headers: getRateLimitHeaders(clientIP, scrapingRateLimiter)
        }
      )
    }

    // Trekk ut metadata
    const metadata = extractMetadata(html, url)

    if (!metadata.title) {
      return NextResponse.json(
        { error: 'Kunne ikke finne produktinformasjon på denne siden' },
        { 
          status: 400,
          headers: getRateLimitHeaders(clientIP, scrapingRateLimiter)
        }
      )
    }

    // Returner nøytrale data som "ønskepris"
    const responseData = {
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
      store_name: metadata.siteName,
      current_price: metadata.price, // Nøytralt navn
      provider: 'scraper', // Internt navn som ikke vises til brukeren
    }

    // Cache resultatet
    productCache.set(cacheKey, responseData, 600000) // 10 minutter

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': 'MISS',
        ...getRateLimitHeaders(clientIP, scrapingRateLimiter)
      }
    })

  } catch (error) {
    console.error('Scraping error:', error)
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    return NextResponse.json(
      { error: 'En uventet feil oppstod ved henting av produktinformasjon' },
      { 
        status: 500,
        headers: getRateLimitHeaders(clientIP, scrapingRateLimiter)
      }
    )
  }
}