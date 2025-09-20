'use client'

import { motion } from 'framer-motion'
import { Gift, Sparkles, Users, Heart } from 'lucide-react'

interface HomePageProps {
  onGetStarted: () => void
  appName: string
}

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -5 }}
    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300"
  >
    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center text-white mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
)

const FloatingElement = ({ children, delay }: { children: React.ReactNode, delay: number }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [-10, 10, -10] }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className="absolute opacity-20"
  >
    {children}
  </motion.div>
)

export default function HomePage({ onGetStarted, appName }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Subtile bakgrunnselementer */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      {/* Flytende jule-elementer - mer subtile */}
      <FloatingElement delay={0}>
        <div className="text-4xl opacity-20" style={{ top: '15%', left: '8%' }}>🎄</div>
      </FloatingElement>
      <FloatingElement delay={1}>
        <div className="text-3xl opacity-15" style={{ top: '25%', right: '12%' }}>⭐</div>
      </FloatingElement>
      <FloatingElement delay={2}>
        <div className="text-4xl opacity-20" style={{ bottom: '35%', left: '15%' }}>🎁</div>
      </FloatingElement>
      <FloatingElement delay={0.5}>
        <div className="text-3xl opacity-15" style={{ bottom: '25%', right: '15%' }}>❄️</div>
      </FloatingElement>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Gift className="text-white" size={40} />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Wishit
            </h1>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Lag den perfekte julegave-opplevelsen for familien
          </motion.p>
        </motion.header>

        {/* Hovedinnhold */}
        <div className="max-w-4xl mx-auto">
          {/* Hero seksjon */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-200/50">
              <div className="flex justify-center gap-4 mb-8">
                <div className="text-5xl">🎄</div>
                <div className="text-5xl">✨</div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Velkommen til Wishit!
              </h2>
              <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Organiser ønskelister, del dem med familie og venner, og få varsler når gavene går på tilbud. 
                Gjør gavehandling enklere og mer organisert for alle.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-10 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto"
              >
                <Gift size={24} />
                Kom i gang
              </motion.button>
            </div>
          </motion.div>

          {/* Funksjoner */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
          >
            <FeatureCard
              icon={<Gift />}
              title="Ønskelister"
              description="Lag og del ønskelister med familie og venner"
            />
            <FeatureCard
              icon={<Users />}
              title="Grupper"
              description="Organiser gavegivning i familiegrupper med budsjett"
            />
            <FeatureCard
              icon={<Sparkles />}
              title="Tilbudsvarsler"
              description="Få beskjed når ønskede gaver går på tilbud"
            />
            <FeatureCard
              icon={<Heart />}
              title="Gavehistorikk"
              description="Hold oversikt over kjøpte og mottatte gaver"
            />
          </motion.div>

          {/* Nedre seksjon */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl p-10 shadow-2xl">
              <h3 className="text-2xl font-bold mb-4">Klar for å starte ønskelistene?</h3>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Bli med på tusenvis av familier som allerede bruker Wishit for bedre gavehandling
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">✅</span>
                  </div>
                  <span>Gratis å komme i gang</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">🔒</span>
                  </div>
                  <span>Trygg og sikker</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">📱</span>
                  </div>
                  <span>Fungerer på alle enheter</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
