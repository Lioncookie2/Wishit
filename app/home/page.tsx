'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Gift, Calendar, Activity, TrendingUp, Crown, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import { Group, WishlistItem } from '@/types'
import toast from 'react-hot-toast'

export default function HomePage() {
  const { user, isPremium } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Last grupper og ønsker parallelt
      const [groupsResult, wishlistResult] = await Promise.all([
        database.getUserGroups(),
        database.getUserWishlistItems()
      ])

      if (groupsResult.data) {
        setGroups(groupsResult.data)
      }
      if (wishlistResult.data) {
        setWishlistItems(wishlistResult.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Kunne ikke laste data')
    } finally {
      setLoading(false)
    }
  }

  // Beregn dager til jul
  const getDaysToChristmas = () => {
    const today = new Date()
    const christmas = new Date(today.getFullYear(), 11, 25) // 25. desember
    
    // Hvis julen har passert i år, regn for neste år
    if (today > christmas) {
      christmas.setFullYear(today.getFullYear() + 1)
    }
    
    const diffTime = christmas.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysToChristmas = getDaysToChristmas()
  const totalWishlistValue = wishlistItems.reduce((sum, item) => sum + (item.current_price || item.price || 0), 0)
  const adminGroups = groups.filter(group => group.admin_id === user?.id)
  const memberGroups = groups.filter(group => group.admin_id !== user?.id)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Logg inn for å se hjemmesiden</h1>
          <p className="text-gray-600">Du må være logget inn for å se oversikten</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-2">Velkommen tilbake! 🎄</h1>
          <p className="text-blue-100 text-lg">
            {daysToChristmas === 1 
              ? 'Julen er i morgen! 🎅' 
              : `Julen er om ${daysToChristmas} dager 🎅`
            }
          </p>
        </motion.div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                <p className="text-sm text-gray-600">Grupper</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Gift className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{wishlistItems.length}</p>
                <p className="text-sm text-gray-600">Ønsker</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Premium Status */}
        {isPremium ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Crown className="text-amber-600" size={24} />
              <div>
                <h3 className="font-semibold text-amber-800">Premium-medlem</h3>
                <p className="text-sm text-amber-700">Du har tilgang til alle funksjoner!</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="text-purple-600" size={24} />
                <div>
                  <h3 className="font-semibold text-purple-800">Oppgrader til Premium</h3>
                  <p className="text-sm text-purple-700">Få tilgang til eksklusive funksjoner</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/premium'}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                Se Premium
              </button>
            </div>
          </motion.div>
        )}

        {/* Grupper Oversikt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Dine grupper</h2>
            <button
              onClick={() => window.location.href = '/groups'}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              Se alle
            </button>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-6">
              <Users className="text-gray-400 mx-auto mb-2" size={32} />
              <p className="text-gray-600 mb-3">Ingen grupper ennå</p>
              <button
                onClick={() => window.location.href = '/groups'}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Opprett gruppe
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.slice(0, 3).map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => window.location.href = `/group/${group.id}`}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-600">
                        {group.admin_id === user?.id ? 'Admin' : 'Medlem'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {group.wishlistCount || 0} ønsker
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Siste aktivitet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} />
            Siste aktivitet
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Gift className="text-green-600" size={16} />
              </div>
              <div>
                <p className="text-sm text-gray-900">Du la til "iPhone 15 Pro"</p>
                <p className="text-xs text-gray-500">2 timer siden</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={16} />
              </div>
              <div>
                <p className="text-sm text-gray-900">Ble med i "Familie jul 2024"</p>
                <p className="text-xs text-gray-500">1 dag siden</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={16} />
              </div>
              <div>
                <p className="text-sm text-gray-900">Prisfall på "AirPods Pro"</p>
                <p className="text-xs text-gray-500">3 dager siden</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 gap-4"
        >
          <button
            onClick={() => window.location.href = '/wishlist'}
            className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors"
          >
            <Gift className="text-blue-600 mx-auto mb-2" size={24} />
            <p className="font-medium text-gray-900">Se ønsker</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/groups'}
            className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors"
          >
            <Users className="text-green-600 mx-auto mb-2" size={24} />
            <p className="font-medium text-gray-900">Se grupper</p>
          </button>
        </motion.div>
      </div>
    </div>
  )
}
