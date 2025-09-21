# 🎄 Julefunksjoner for Wishit

## ✅ Implementerte funksjoner

### 1. 🎁 Mystery Gift
- **Lokasjon**: Tre-prikkers meny i gruppekort
- **Funksjonalitet**: 
  - Admin kan aktivere Mystery Gift med budsjett per person
  - Medlemmer legger inn én liten gaveidé (f.eks. <200 kr)
  - Systemet trekker tilfeldig fordeling
  - Hver deltaker ser kun sin mottaker
- **Filer**:
  - `app/api/mystery-gift/route.ts` - API for Mystery Gift
  - `components/MysteryGiftModal.tsx` - Modal for Mystery Gift
  - `components/GroupCard.tsx` - Oppdatert med Mystery Gift-knapp

### 2. 💰 Gruppens budsjett og prisoversikt (Premium)
- **Lokasjon**: Gruppeside (`app/group/[id]/page.tsx`)
- **Funksjonalitet**:
  - Totalpris på ønskene i gruppen
  - Sum per medlem med kjøpestatus
  - Gjennomsnitt per medlem
  - Statistikk (høyest/lavest verdi)
- **Filer**:
  - `app/api/group-prices/[id]/route.ts` - API for prisoversikt
  - `components/GroupPriceOverview.tsx` - Komponent for prisoversikt

### 3. 🎅 Secret Santa Pro
- **Lokasjon**: Tre-prikkers meny (kun for premium)
- **Funksjonalitet**:
  - Premium-funksjon med budsjettstyring
  - Hemmelig gaveutveksling
  - Hver deltaker får kun én mottaker
- **Filer**:
  - `components/SecretSantaModal.tsx` - Oppdatert med "Pro" branding

### 4. 📉 Ønskepris med prisfall-varsel
- **Funksjonalitet**:
  - Viser "Ønskepris" i stedet for "Prisjakt"
  - Sporer `current_price` og `previous_price`
  - Automatisk prisoppdatering via cron-jobb
  - Push-varsler ved prisfall
- **Filer**:
  - `app/api/scrape-product/route.ts` - Oppdatert for nøytrale data
  - `app/api/update-prices/route.ts` - Cron-jobb for prisoppdatering
  - `app/api/send-notifications/route.ts` - Push-varsler
  - `components/WishlistCard.tsx` - Viser ønskepris og prisfall

### 5. 🤝 Delbetaling/bidrag på gaver
- **Funksjonalitet**:
  - "Bidra"-knapp på hvert ønske
  - Brukere kan bidra med beløp + kommentar
  - Progress bar viser finansieringsgrad
  - "Fullfinansiert ✅" når målet er nådd
- **Filer**:
  - `components/GiftContributionModal.tsx` - Modal for bidrag
  - `components/WishlistCard.tsx` - Oppdatert med bidrag-visning
  - `lib/database.ts` - `contributeToPurchase`-funksjon

## 🗄️ Database-endringer

### Nye kolonner i `wishlists`-tabellen:
```sql
-- Prisoppfølging
current_price numeric(10,2)
previous_price numeric(10,2)
price_provider text
last_price_check timestamp with time zone
price_drop_notification_sent boolean default false

-- Bidrag
contributions jsonb default '[]'
total_contributed numeric(10,2) default 0
is_fully_funded boolean default false
```

### Nye kolonner i `groups`-tabellen:
```sql
-- Mystery Gift
mystery_gift_enabled boolean default false
mystery_gift_budget numeric(10,2) default 200
```

## 🚀 Installasjon og oppsett

### 1. Kjør database-migrasjoner
```sql
-- Kjør i Supabase SQL Editor
-- Fil: supabase/quick-fix-rls.sql
```

### 2. Installer nye pakker
```bash
npm install he @headlessui/react
```

### 3. Miljøvariabler
Sørg for at disse er satt i `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📱 Brukergrensesnitt

### Gruppekort
- Tre-prikkers meny med:
  - Mystery Gift (gratis)
  - Secret Santa Pro (premium)
  - Del gruppe
  - Kopier kode

### Gruppeside
- Prisoversikt (premium)
- Medlemsoversikt
- Ønskeliste med bidrag-funksjonalitet

### Ønskekort
- "Ønskepris" i stedet for "Prisjakt"
- Prisfall-indikator
- Bidrag-progress bar
- "Bidra"-knapp

## 🔧 API-endepunkter

### Mystery Gift
- `POST /api/mystery-gift`
  - `action: 'enable'` - Aktiver Mystery Gift
  - `action: 'add_gift'` - Legg til gaveidé
  - `action: 'draw'` - Start trekning
  - `action: 'get_my_gift'` - Hent min mottaker

### Prisoversikt
- `GET /api/group-prices/[id]` - Hent gruppens prisoversikt

### Prisoppdatering
- `POST /api/update-prices` - Oppdater alle priser
- `POST /api/send-notifications` - Send prisfall-varsler

## ⚙️ Cron-jobb

Vercel Cron er konfigurert i `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/update-prices",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## 🎯 Premium vs Gratis

### Gratis funksjoner:
- Mystery Gift
- Delbetaling/bidrag
- Grunnleggende ønskeliste

### Premium funksjoner:
- Secret Santa Pro
- Prisoversikt for grupper
- Avanserte statistikk

## 🐛 Feilsøking

### RLS-problemer
Hvis du får "permission denied" feil:
1. Kjør `supabase/quick-fix-rls.sql` i Supabase
2. Dette deaktiverer RLS midlertidig

### Test database-tilgang
Gå til `http://localhost:3000/api/test-db` for å teste tilkobling

## 📝 Notater

- Alle nye funksjoner er bakoverkompatible
- HTML entities (æ/ø/å) er dekodet med `he`-biblioteket
- Push-varsler er simulert i konsollen (kan kobles til FCM/OneSignal)
- Mystery Gift og bidrag er gratis for å bygge engasjement
