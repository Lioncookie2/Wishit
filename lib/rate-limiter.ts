// Enkel in-memory rate limiter for API-endepunkter
interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(key: string): boolean {
    const now = Date.now()
    const entry = this.requests.get(key)

    if (!entry) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    // Sjekk om vinduet har utløpt
    if (now > entry.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    // Sjekk om vi har overskredet grensen
    if (entry.count >= this.maxRequests) {
      return false
    }

    // Øk teller
    entry.count++
    return true
  }

  getRemainingRequests(key: string): number {
    const entry = this.requests.get(key)
    if (!entry) return this.maxRequests

    const now = Date.now()
    if (now > entry.resetTime) {
      return this.maxRequests
    }

    return Math.max(0, this.maxRequests - entry.count)
  }

  getResetTime(key: string): number {
    const entry = this.requests.get(key)
    return entry?.resetTime || Date.now() + this.windowMs
  }

  // Rydd opp utløpte entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Opprett rate limiter instanser for forskjellige endepunkter
export const scrapingRateLimiter = new RateLimiter(60000, 10) // 10 requests per minute
export const apiRateLimiter = new RateLimiter(60000, 100) // 100 requests per minute
export const authRateLimiter = new RateLimiter(300000, 5) // 5 requests per 5 minutes

// Rydd opp hvert minutt
setInterval(() => {
  scrapingRateLimiter.cleanup()
  apiRateLimiter.cleanup()
  authRateLimiter.cleanup()
}, 60000)

export function getRateLimitHeaders(key: string, limiter: RateLimiter) {
  return {
    'X-RateLimit-Limit': limiter['maxRequests'].toString(),
    'X-RateLimit-Remaining': limiter.getRemainingRequests(key).toString(),
    'X-RateLimit-Reset': new Date(limiter.getResetTime(key)).toISOString()
  }
}
