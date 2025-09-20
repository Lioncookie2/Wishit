# 🎄 Julegaveapp

En moderne web-applikasjon for å organisere julehandel med ønskelister, gruppeplanlegging og tilbudsvarsler.

## ✨ Funksjoner

### 🎯 Grunnleggende funksjoner
- **Splash Screen**: Elegant oppstartsanimasjon med MilesTech-branding
- **Responsivt design**: Fungerer perfekt på mobil, tablet og desktop
- **Autentisering**: Sikker pålogging med Supabase
- **Ønskelister**: Automatisk henting av produktinfo fra URL
- **Gruppefunksjonalitet**: Del ønskelister med familie og venner
- **Budsjettplanlegging**: Sett budsjett per gruppe eller medlem

### 💎 Premium-funksjoner
- **Tilbudsvarsler**: Få varsler når ønskede produkter går på tilbud
- **Prishistorikk**: Se prisutviklingen over tid
- **Avanserte grupper**: Utvidede gruppefunksjoner

### 🛍️ Støttede nettsteder
- Elkjøp
- Komplett
- Power
- Expert
- Eplehuset
- Amazon
- Flere kommer...

## 🚀 Teknologi

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (database, auth, real-time)
- **API**: Next.js API routes for web scraping
- **Deployment**: Vercel-klar

## 📱 Installasjon og oppsett

### Forutsetninger
- Node.js 18+
- npm eller yarn
- Supabase-prosjekt

### 1. Klone prosjektet
\`\`\`bash
git clone <repository-url>
cd julegaveapp
\`\`\`

### 2. Installer avhengigheter
\`\`\`bash
npm install
# eller
yarn install
\`\`\`

### 3. Sett opp miljøvariabler
Kopier \`.env.local.example\` til \`.env.local\` og fyll inn:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_NAME=Julegaveapp
\`\`\`

### 4. Sett opp database
Kjør SQL-skriptet i \`supabase/schema.sql\` i din Supabase-konsoll:

1. Gå til Supabase Dashboard → SQL Editor
2. Kopier innholdet fra \`supabase/schema.sql\`
3. Kjør skriptet

### 5. Start utviklingsserver
\`\`\`bash
npm run dev
# eller
yarn dev
\`\`\`

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## 🗃️ Database-struktur

- **profiles**: Brukerinformasjon og premium-status
- **groups**: Familiegrupper og budsjettinfo
- **group_members**: Gruppemedlemskap og roller
- **wishlists**: Ønskelister med produktdata
- **invitations**: Gruppeinvitasjoner

## 🔧 Konfigurasjon

### App-navn
Endre app-navnet i \`.env.local\`:
\`\`\`env
NEXT_PUBLIC_APP_NAME=Ditt_App_Navn
\`\`\`

### Julefarger
Juster farger i \`tailwind.config.js\`:
\`\`\`js
colors: {
  christmas: {
    red: '#c41e3a',
    green: '#2d5016',
    gold: '#ffd700',
    white: '#f8f8ff',
  }
}
\`\`\`

## 📦 Deployment

### Vercel (anbefalt)
1. Push koden til GitHub
2. Koble GitHub-repo til Vercel
3. Legg til miljøvariabler i Vercel
4. Deploy automatisk

### Manuell deployment
\`\`\`bash
npm run build
npm start
\`\`\`

## 🧪 Testing

\`\`\`bash
# Lint kode
npm run lint

# Type-sjekking
npx tsc --noEmit
\`\`\`

## 📱 iOS-app (fremtidig)

Denne web-appen er designet for å kunne eksporteres til en native iOS-app med minimal endring. Responsive design og touch-optimaliserte komponenter gjør overgangen smidig.

## 🤝 Bidrag

1. Fork prosjektet
2. Opprett en feature branch (\`git checkout -b feature/ny-funksjon\`)
3. Commit endringene (\`git commit -am 'Legg til ny funksjon'\`)
4. Push til branch (\`git push origin feature/ny-funksjon\`)
5. Opprett en Pull Request

## 📄 Lisens

Dette prosjektet er lisensiert under MIT License.

## 🎄 Support

For support og spørsmål, kontakt MilesTech support eller opprett en issue i GitHub-repositoryet.

---

**God jul og takk for at du bruker Julegaveapp! 🎅🎁**
