# Ønskepris - Prisoppfølging og Varsler

Denne funksjonaliteten lar brukere spore priser på ønsker og få varsler når prisen faller.

## Funksjoner

### 1. Prisoppfølging
- **Nåværende pris**: Viser den nåværende prisen på produktet
- **Tidligere pris**: Lagrer tidligere pris for å oppdage prisfall
- **Prisfall-deteksjon**: Automatisk oppdaging når prisen går ned
- **Priskilde**: Sporer hvor prisen kommer fra (scraper, manual, etc.)

### 2. Automatisk prisoppdatering
- **Cron-jobb**: Oppdaterer priser daglig kl. 09:00
- **Manuell oppdatering**: Knapp for å oppdatere priser umiddelbart
- **Rate limiting**: 1 sekund delay mellom hver prisoppdatering

### 3. Push-varsler
- **Prisfall-varsler**: Automatisk varsling når prisen faller
- **Varsel-status**: Sporer om varsel er sendt for hver prisfall

## Database Schema

```sql
-- Legg til prisfelter i wishlists tabellen
ALTER TABLE public.wishlists 
ADD COLUMN current_price numeric(10,2),
ADD COLUMN previous_price numeric(10,2),
ADD COLUMN price_provider text,
ADD COLUMN last_price_check timestamp with time zone,
ADD COLUMN price_drop_notification_sent boolean default false;
```

## API Endpoints

### `/api/scrape-product`
- **Metode**: POST
- **Funksjon**: Henter produktinformasjon og pris fra URL
- **Respons**: Nøytrale data som "ønskepris"

### `/api/update-prices`
- **Metode**: POST
- **Funksjon**: Oppdaterer priser for alle ønsker
- **Cron**: Kjøres daglig kl. 09:00

### `/api/send-notifications`
- **Metode**: POST
- **Funksjon**: Sender varsler for prisfall
- **Kjøres**: Automatisk etter prisoppdatering

## Frontend Endringer

### WishlistCard
- Viser "Ønskepris" i stedet for "Prisjakt"
- Viser prisfall med grønn tekst og 📉-ikon
- Viser når prisen sist ble sjekket

### AddWishModal
- Håndterer nye prisfelter ved opprettelse
- Setter automatisk prisprovider basert på kilde

### Gruppeside
- "Oppdater priser"-knapp for manuell prisoppdatering
- Viser antall oppdaterte priser og prisfall

## Konfigurasjon

### Vercel Cron
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

### Miljøvariabler
```env
NEXT_PUBLIC_APP_URL=https://din-app.vercel.app
```

## Støttede Nettsteder

- Elkjøp.no
- Komplett.no
- Power.no
- Expert.no
- Eplehuset.no
- Amazon.com/no
- Prisguiden.no
- Prisjakt.no

## Utvidelse for Push-varsler

For å implementere ekte push-varsler, legg til:

1. **Firebase Cloud Messaging (FCM)**
2. **OneSignal**
3. **E-post-varsler**

Eksempel med FCM:
```typescript
import admin from "firebase-admin";

export async function sendPriceDropNotification(userToken: string, productName: string, newPrice: number) {
  const message = {
    notification: {
      title: "Prisfall på ønsket gave 🎁",
      body: `${productName} koster nå ${newPrice} kr`,
    },
    token: userToken,
  };

  await admin.messaging().send(message);
}
```

## Testing

### Test prisoppdatering
```bash
curl -X POST http://localhost:3000/api/update-prices
```

### Test varsler
```bash
curl -X POST http://localhost:3000/api/send-notifications
```

## Feilsøking

1. **Priser oppdateres ikke**: Sjekk at URL-er er gyldige og støttede
2. **Cron-jobb kjører ikke**: Sjekk Vercel-konfigurasjon
3. **Varsler sendes ikke**: Sjekk at prisfall-deteksjon fungerer
4. **Rate limiting**: Øk delay mellom API-kall hvis nødvendig
