'use client'

import { motion } from 'framer-motion'
import { Crown, Zap, Bell, TrendingDown, X } from 'lucide-react'
import { useState } from 'react'

interface PremiumBannerProps {
  onUpgrade?: () => void
  onDismiss?: () => void
}

export default function PremiumBanner({ onUpgrade, onDismiss }: PremiumBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white p-4 rounded-xl mb-6 relative overflow-hidden shadow-lg"
    >
      {/* Bakgrunnsmønster */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/80 hover:text-white z-10"
      >
        <X size={16} />
      </button>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Crown className="text-white" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Oppgrader til Premium!</h3>
            <p className="text-white/90 text-sm">Få tilbudsvarsler og prishistorikk</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">99 kr</span>
            <span className="text-white/80 text-sm">/år</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUpgrade}
            className="bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-all duration-200 shadow-sm text-sm"
          >
            Oppgrader
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
