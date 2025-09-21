'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Gift, TrendingDown, Users, Crown, Check, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: 'price_drop' | 'gift_purchased' | 'group_activity' | 'secret_santa' | 'premium'
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any
}

export default function NotificationsPage() {
  const { user, isPremium } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      // Simulerte notifikasjoner for demo
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'price_drop',
          title: 'Prisfall! 🔥',
          message: 'iPhone 15 Pro har falt med 500 kr - nå kun 13,490 kr',
          timestamp: '2025-09-21T18:30:00Z',
          read: false,
          data: { originalPrice: 13990, newPrice: 13490, product: 'iPhone 15 Pro' }
        },
        {
          id: '2',
          type: 'gift_purchased',
          title: 'Gave kjøpt! 🎁',
          message: 'Sebastian kjøpte "Sittepute" for Kari',
          timestamp: '2025-09-21T15:20:00Z',
          read: false,
          data: { buyer: 'Sebastian', item: 'Sittepute', recipient: 'Kari' }
        },
        {
          id: '3',
          type: 'group_activity',
          title: 'Ny gruppe! 👥',
          message: 'Du ble lagt til i gruppen "Julefest 2025"',
          timestamp: '2025-09-21T12:10:00Z',
          read: true,
          data: { groupName: 'Julefest 2025' }
        },
        {
          id: '4',
          type: 'secret_santa',
          title: 'Secret Santa! 🎅',
          message: 'Du har fått tildelt din hemmelige gaveperson',
          timestamp: '2025-09-20T20:00:00Z',
          read: true,
          data: { recipient: 'Kari', budget: 500 }
        },
        {
          id: '5',
          type: 'premium',
          title: 'Premium aktivert! ⭐',
          message: 'Velkommen til Wishit Premium! Alle funksjoner er nå tilgjengelige',
          timestamp: '2025-09-20T10:30:00Z',
          read: true,
          data: {}
        }
      ]

      setNotifications(mockNotifications)
    } catch (error) {
      toast.error('Kunne ikke laste varsler')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
  }

  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    toast.success('Alle varsler markert som lest')
  }

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    )
    toast.success('Varsel slettet')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_drop': return <TrendingDown className="text-green-500" size={20} />
      case 'gift_purchased': return <Gift className="text-blue-500" size={20} />
      case 'group_activity': return <Users className="text-purple-500" size={20} />
      case 'secret_santa': return <Crown className="text-yellow-500" size={20} />
      case 'premium': return <Crown className="text-gold-500" size={20} />
      default: return <Bell className="text-gray-500" size={20} />
    }
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

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell size={32} className="text-blue-500" />
            Varsler
          </h1>
          {unreadCount > 0 && (
            <p className="text-gray-600 mt-1">
              Du har {unreadCount} uleste varsler
            </p>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Merk alle som lest
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white rounded-xl shadow-sm"
          >
            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen varsler</h3>
            <p className="text-gray-500">Du har ingen varsler for øyeblikket</p>
          </motion.div>
        ) : (
          notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 bg-white rounded-xl shadow-sm border-l-4 ${
                notification.read 
                  ? 'border-gray-200' 
                  : 'border-blue-500 bg-blue-50/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-gray-700 mb-2">
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Merk som lest"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Slett varsel"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              {/* Special content for different notification types */}
              {notification.type === 'price_drop' && notification.data && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Før:</span>
                    <span className="line-through text-gray-500">
                      {notification.data.originalPrice} kr
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-green-600">Nå:</span>
                    <span className="text-green-600">
                      {notification.data.newPrice} kr
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Spar {notification.data.originalPrice - notification.data.newPrice} kr!
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}