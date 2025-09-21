'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Users, TrendingUp, TrendingDown, Crown, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface GroupPriceOverviewProps {
  groupId: string
  isPremium: boolean
}

interface MemberPrice {
  name: string
  total: number
  count: number
  purchased: number
}

interface PriceData {
  members: MemberPrice[]
  totals: {
    totalWishlistValue: number
    totalPurchased: number
    totalRemaining: number
    averagePerMember: number
    memberCount: number
  }
  summary: {
    mostExpensive: MemberPrice | null
    leastExpensive: MemberPrice | null
    totalWishlists: number
  }
}

export default function GroupPriceOverview({ groupId, isPremium }: GroupPriceOverviewProps) {
  const { user } = useAuth()
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isPremium) {
      loadPriceData()
    }
  }, [groupId, isPremium])

  const loadPriceData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/group-prices/${groupId}`)
      const data = await response.json()

      if (data.success) {
        setPriceData(data.data)
      } else {
        setError(data.error || 'Kunne ikke laste prisoversikt')
      }
    } catch (error) {
      console.error('Error loading price data:', error)
      setError('Noe gikk galt ved lasting av prisoversikt')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!isPremium) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="text-amber-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-amber-800">Prisoversikt</h3>
            <p className="text-sm text-amber-700">Premium-funksjon</p>
          </div>
        </div>
        <p className="text-amber-700 mb-4">
          Oppgrader til Premium for å se detaljert prisoversikt for gruppen
        </p>
        <button className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:from-amber-600 hover:to-yellow-600 transition-colors">
          <Crown className="inline mr-2" size={16} />
          Oppgrader til Premium
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !priceData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-red-800 font-medium">Feil ved lasting</span>
        </div>
        <p className="text-red-700">{error || 'Kunne ikke laste prisoversikt'}</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
          <DollarSign className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Prisoversikt</h3>
          <p className="text-sm text-gray-600">Totalt {priceData.totals.memberCount} medlemmer</p>
        </div>
      </div>

      {/* Totale tall */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-blue-600" size={16} />
            <span className="text-sm font-medium text-blue-800">Total ønskeverdi</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {formatPrice(priceData.totals.totalWishlistValue)}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-600" size={16} />
            <span className="text-sm font-medium text-green-800">Kjøpt</span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {formatPrice(priceData.totals.totalPurchased)}
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-orange-600" size={16} />
            <span className="text-sm font-medium text-orange-800">Gjenstår</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            {formatPrice(priceData.totals.totalRemaining)}
          </p>
        </div>
      </div>

      {/* Gjennomsnitt */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Gjennomsnitt per medlem</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatPrice(priceData.totals.averagePerMember)}
          </span>
        </div>
      </div>

      {/* Medlemsoversikt */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 mb-3">Priser per medlem</h4>
        {priceData.members.map((member, index) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-gray-600">
                  {member.name[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">
                  {member.count} ønsker • {member.purchased > 0 ? `${formatPrice(member.purchased)} kjøpt` : 'Ingen kjøpt'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {formatPrice(member.total)}
              </p>
              {member.purchased > 0 && (
                <p className="text-xs text-green-600">
                  {Math.round((member.purchased / member.total) * 100)}% kjøpt
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Statistikk */}
      {priceData.summary.mostExpensive && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="text-green-600" size={14} />
                <span className="text-sm font-medium text-green-800">Høyest verdi</span>
              </div>
              <p className="text-sm text-green-700">
                {priceData.summary.mostExpensive.name}: {formatPrice(priceData.summary.mostExpensive.total)}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="text-blue-600" size={14} />
                <span className="text-sm font-medium text-blue-800">Lavest verdi</span>
              </div>
              <p className="text-sm text-blue-700">
                {priceData.summary.leastExpensive?.name}: {formatPrice(priceData.summary.leastExpensive?.total || 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
