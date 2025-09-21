'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp, Minus, Lock, Crown, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface PriceItem {
  id: string
  title: string
  currentPrice: number
  previousPrice?: number
  priceChange: number
  priceChangePercent: number
  lastUpdated: string
  imageUrl?: string
  productUrl?: string
  owner: string
  groupName: string
}

export default function PriceOverviewPage() {
  const { user, isPremium } = useAuth()
  const router = useRouter()
  const [priceItems, setPriceItems] = useState<PriceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  useEffect(() => {
    loadPriceData()
  }, [])

  const loadPriceData = async () => {
    setLoading(true)
    try {
      // Simulerte prisdata for demo
      const mockPriceData: PriceItem[] = [
        {
          id: '1',
          title: 'iPhone 15 Pro 128GB',
          currentPrice: 13490,
          previousPrice: 13990,
          priceChange: -500,
          priceChangePercent: -3.6,
          lastUpdated: '2025-09-21T18:30:00Z',
          imageUrl: '/placeholder-iphone.jpg',
          productUrl: 'https://www.elkjop.no/iphone-15-pro',
          owner: 'Sebastian',
          groupName: 'Familie'
        },
        {
          id: '2',
          title: 'Sony WH-1000XM5 Hodetelefoner',
          currentPrice: 3490,
          previousPrice: 3290,
          priceChange: 200,
          priceChangePercent: 6.1,
          lastUpdated: '2025-09-21T15:20:00Z',
          imageUrl: '/placeholder-headphones.jpg',
          productUrl: 'https://www.elkjop.no/sony-wh-1000xm5',
          owner: 'Kari',
          groupName: 'Venner'
        },
        {
          id: '3',
          title: 'Apple Watch Series 9',
          currentPrice: 4490,
          previousPrice: 4490,
          priceChange: 0,
          priceChangePercent: 0,
          lastUpdated: '2025-09-21T12:10:00Z',
          imageUrl: '/placeholder-watch.jpg',
          productUrl: 'https://www.apple.com/apple-watch-series-9',
          owner: 'Ola',
          groupName: 'Familie'
        },
        {
          id: '4',
          title: 'Nintendo Switch OLED',
          currentPrice: 2790,
          previousPrice: 3190,
          priceChange: -400,
          priceChangePercent: -12.5,
          lastUpdated: '2025-09-20T20:00:00Z',
          imageUrl: '/placeholder-switch.jpg',
          productUrl: 'https://www.elkjop.no/nintendo-switch-oled',
          owner: 'Emma',
          groupName: 'Venner'
        },
        {
          id: '5',
          title: 'Dyson V15 Detect',
          currentPrice: 5990,
          previousPrice: 6490,
          priceChange: -500,
          priceChangePercent: -7.7,
          lastUpdated: '2025-09-20T10:30:00Z',
          imageUrl: '/placeholder-dyson.jpg',
          productUrl: 'https://www.dyson.no/v15-detect',
          owner: 'Sebastian',
          groupName: 'Familie'
        }
      ]

      setPriceItems(mockPriceData)
    } catch (error) {
      toast.error('Kunne ikke laste prisdata')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Akkurat nå'
    if (diffInHours < 24) return `${diffInHours} timer siden`
    if (diffInHours < 48) return 'I går'
    return date.toLocaleDateString('no-NO')
  }

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="text-red-500" size={16} />
    if (change < 0) return <TrendingDown className="text-green-500" size={16} />
    return <Minus className="text-gray-500" size={16} />
  }

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-red-500'
    if (change < 0) return 'text-green-500'
    return 'text-gray-500'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Premium gating - show blurred content if not premium
  const isContentBlurred = !isPremium

  return (
    <div className="container mx-auto p-4 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingDown size={32} className="text-blue-500" />
            Ønskepris Oversikt
          </h1>
          <p className="text-gray-600 mt-1">
            Følg prisendringer på alle ønskede produkter
          </p>
        </div>
        
        {!isPremium && (
          <div className="flex items-center gap-3">
            <Crown className="text-yellow-500" size={20} />
            <span className="text-sm text-gray-600">Premium funksjon</span>
          </div>
        )}
      </div>

      {/* Premium Gate Overlay */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl"
        >
          <div className="text-center">
            <Crown className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Premium funksjon</h3>
            <p className="text-gray-600 mb-4">
              Ønskepris oversikt er kun tilgjengelig for Premium-medlemmer
            </p>
            <button
              onClick={() => router.push('/premium')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
            >
              <Crown size={20} />
              Oppgrader til Premium
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats Overview */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ${isContentBlurred ? 'filter blur-sm pointer-events-none' : ''}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="text-green-500" size={24} />
            <h3 className="font-semibold text-gray-900">Prisfall</h3>
          </div>
          <p className="text-3xl font-bold text-green-500">3</p>
          <p className="text-sm text-gray-600">produkter på tilbud</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-red-500" size={24} />
            <h3 className="font-semibold text-gray-900">Prisøkning</h3>
          </div>
          <p className="text-3xl font-bold text-red-500">1</p>
          <p className="text-sm text-gray-600">produkt dyrere</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center gap-3 mb-2">
            <Eye className="text-blue-500" size={24} />
            <h3 className="font-semibold text-gray-900">Overvåkes</h3>
          </div>
          <p className="text-3xl font-bold text-blue-500">{priceItems.length}</p>
          <p className="text-sm text-gray-600">produkter totalt</p>
        </motion.div>
      </div>

      {/* Price Items List */}
      <div className={`space-y-4 ${isContentBlurred ? 'filter blur-sm pointer-events-none' : ''}`}>
        {priceItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white rounded-xl shadow-sm"
          >
            <TrendingDown className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen produkter</h3>
            <p className="text-gray-500">Legg til ønsker med URL for å spore priser</p>
          </motion.div>
        ) : (
          priceItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Product Image */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-2xl">🎁</div>
                </div>
                
                {/* Product Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{item.owner}</span>
                        <span>•</span>
                        <span>{item.groupName}</span>
                      </div>
                    </div>
                    
                    {/* Price Info */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(item.currentPrice)}
                      </div>
                      {item.previousPrice && item.priceChange !== 0 && (
                        <div className={`flex items-center gap-1 text-sm ${getPriceChangeColor(item.priceChange)}`}>
                          {getPriceChangeIcon(item.priceChange)}
                          <span>
                            {item.priceChange > 0 ? '+' : ''}{formatPrice(item.priceChange)}
                          </span>
                          <span>
                            ({item.priceChangePercent > 0 ? '+' : ''}{item.priceChangePercent.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Previous Price */}
                  {item.previousPrice && item.priceChange !== 0 && (
                    <div className="text-sm text-gray-500 mb-2">
                      Tidligere pris: <span className="line-through">{formatPrice(item.previousPrice)}</span>
                    </div>
                  )}
                  
                  {/* Last Updated */}
                  <div className="text-xs text-gray-500">
                    Sist oppdatert: {formatTimestamp(item.lastUpdated)}
                  </div>
                  
                  {/* Special notification for price drops */}
                  {item.priceChange < 0 && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <TrendingDown size={16} />
                        <span className="font-medium">Prisfall!</span>
                        <span>Spar {formatPrice(Math.abs(item.priceChange))}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Locked content overlay for non-premium users */}
      {!isPremium && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" style={{ pointerEvents: 'none' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 m-4 text-center shadow-xl max-w-md"
            style={{ pointerEvents: 'auto' }}
          >
            <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Premium påkrevd</h3>
            <p className="text-gray-600 mb-4">
              Denne funksjonen krever Premium-medlemskap for å se detaljerte prisdata
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/premium')}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
              >
                Oppgrader
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Tilbake
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
