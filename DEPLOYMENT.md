# 🚀 Deployment Guide for Wishit

## Vercel Deployment

### 1. Miljøvariabler i Vercel
Sett opp følgende miljøvariabler i Vercel Dashboard:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# RevenueCat Configuration
NEXT_PUBLIC_REVENUECAT_API_KEY=your_revenuecat_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 2. Supabase Setup
Kjør følgende SQL-filer i Supabase SQL Editor:
- `supabase/account-deletion-function.sql`
- `supabase/premium-transactions.sql`
- `supabase/push-tokens.sql`

### 3. RevenueCat Setup
1. Opprett prosjekt i RevenueCat Dashboard
2. Konfigurer Apple StoreKit
3. Legg til API-nøkkel i miljøvariabler

### 4. Capacitor Configuration
Etter Vercel deployment, oppdater `capacitor.config.ts`:
```typescript
server: {
  url: 'https://your-app.vercel.app',
  cleartext: true
}
```

## App Store Features ✅

- ✅ Konto-sletting med GDPR-compliance
- ✅ Premium/IAP med Apple StoreKit
- ✅ Push-varsler for prisendringer
- ✅ Privacy policy og terms of service
- ✅ Rate limiting og caching
- ✅ UX-forbedringer og tilgjengelighet
- ✅ ARIA-labels og Reduce Motion-støtte

## Testing
Test alle funksjoner på ekte enheter før App Store-innlevering:
- IAP-funksjoner
- Push-varsler
- Konto-sletting
- Premium-funksjoner
