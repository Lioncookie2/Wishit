// Enkel in-memory cache for API-responser
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly defaultTtl: number

  constructor(defaultTtl: number = 300000) { // 5 minutter default
    this.defaultTtl = defaultTtl
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Rydd opp utløpte entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Hent cache-statistikk
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries
    }
  }
}

// Opprett cache instanser for forskjellige typer data
export const productCache = new Cache(600000) // 10 minutter for produkter
export const priceCache = new Cache(300000) // 5 minutter for priser
export const userCache = new Cache(1800000) // 30 minutter for brukerdata

// Rydd opp hvert minutt
setInterval(() => {
  productCache.cleanup()
  priceCache.cleanup()
  userCache.cleanup()
}, 60000)

// Cache nøkler
export const CacheKeys = {
  PRODUCT: (url: string) => `product:${url}`,
  PRICE: (url: string) => `price:${url}`,
  USER: (userId: string) => `user:${userId}`,
  GROUP: (groupId: string) => `group:${groupId}`,
  WISHLIST: (userId: string) => `wishlist:${userId}`
} as const
