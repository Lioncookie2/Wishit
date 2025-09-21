'use client'

import { motion } from 'framer-motion'
import { Users, Crown, Calendar, DollarSign, Gift, Share2, MoreVertical, Plus, Shuffle, Sparkles } from 'lucide-react'
import { Group } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import he from 'he'
import { Menu } from '@headlessui/react'

interface GroupCardProps {
  group: Group
  memberCount?: number
  wishlistCount?: number
  onClick?: () => void
  onShare?: (group: Group) => void
  onAddWish?: (groupId: string) => void
  onSecretSanta?: (groupId: string) => void
  onMysteryGift?: (groupId: string) => void
  isPremium?: boolean
}

export default function GroupCard({ group, memberCount = 0, wishlistCount = 0, onClick, onShare, onAddWish, onSecretSanta, onMysteryGift, isPremium = false }: GroupCardProps) {
  const { user } = useAuth()
  const isAdmin = user?.id === group.admin_id

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleMenuAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    switch (action) {
      case 'share':
        onShare?.(group)
        break
      case 'addWish':
        onAddWish?.(group.id)
        break
      case 'copyCode':
        if (group.join_code) {
          navigator.clipboard.writeText(group.join_code)
          // TODO: Add toast notification
        }
        break
      case 'secretSanta':
        onSecretSanta?.(group.id)
        break
      case 'mysteryGift':
        onMysteryGift?.(group.id)
        break
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200/50 cursor-pointer hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
    >
      {/* Bakgrunnsdekorasjon */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-12 translate-x-12 opacity-40 group-hover:opacity-60 transition-opacity" />
      
      {/* Header med kebab-meny */}
      <div className="relative z-10 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {he.decode(group.name)}
            </h3>
            {isAdmin && (
              <Crown className="text-amber-500" size={20} />
            )}
          </div>
          
          {/* Kebab-meny */}
          <Menu as="div" className="relative">
            <Menu.Button
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical size={18} />
            </Menu.Button>
            
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={(e) => handleMenuAction('addWish', e)}
                    className={`w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 ${
                      active ? 'bg-gray-50' : ''
                    }`}
                  >
                    <Plus size={16} />
                    Legg til ønske
                  </button>
                )}
              </Menu.Item>
              
              {isAdmin && onShare && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={(e) => handleMenuAction('share', e)}
                      className={`w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 ${
                        active ? 'bg-gray-50' : ''
                      }`}
                    >
                      <Share2 size={16} />
                      Del gruppe
                    </button>
                  )}
                </Menu.Item>
              )}
              
              {isAdmin && onMysteryGift && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={(e) => handleMenuAction('mysteryGift', e)}
                      className={`w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 ${
                        active ? 'bg-gray-50' : ''
                      }`}
                    >
                      <Sparkles size={16} />
                      Mystery Gift
                    </button>
                  )}
                </Menu.Item>
              )}
              
              {isAdmin && isPremium && onSecretSanta && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={(e) => handleMenuAction('secretSanta', e)}
                      className={`w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 ${
                        active ? 'bg-gray-50' : ''
                      }`}
                    >
                      <Shuffle size={16} />
                      Secret Santa Pro
                    </button>
                  )}
                </Menu.Item>
              )}
              
              {group.join_code && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={(e) => handleMenuAction('copyCode', e)}
                      className={`w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 ${
                        active ? 'bg-gray-50' : ''
                      }`}
                    >
                      <Users size={16} />
                      Kopier kode
                    </button>
                  )}
                </Menu.Item>
              )}
            </Menu.Items>
          </Menu>
        </div>
        
        {group.description && (
          <p className="text-gray-600 text-sm leading-relaxed">
            {he.decode(group.description)}
          </p>
        )}
      </div>

      {/* Stats - kompakt layout */}
      <div className="relative z-10 flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="text-gray-400" size={18} />
          <span className="text-sm font-medium">{memberCount} medlemmer</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <Gift className="text-gray-400" size={18} />
          <span className="text-sm font-medium">{wishlistCount} ønsker</span>
        </div>
      </div>

      {/* Budget */}
      {(group.budget || group.budget_per_member) && (
        <div className="relative z-10 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-600" size={16} />
              <span className="text-sm font-semibold text-green-800">Budsjett</span>
            </div>
            <div className="space-y-1">
              {group.budget && (
                <div className="text-sm text-green-700">
                  Totalt: <span className="font-semibold">{formatBudget(group.budget)}</span>
                </div>
              )}
              {group.budget_per_member && (
                <div className="text-sm text-green-700">
                  Per medlem: <span className="font-semibold">{formatBudget(group.budget_per_member)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Calendar size={14} />
          <span>Opprettet {formatDate(group.created_at)}</span>
        </div>
        
        {isAdmin && (
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
            Admin
          </span>
        )}
      </div>
    </motion.div>
  )
}