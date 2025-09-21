'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Gift, Heart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import { WishlistItem } from '@/types'
import WishlistCard from '@/components/WishlistCard'
import AddWishModal from '@/components/AddWishModal'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const { user, signOut } = useAuth()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddWish, setShowAddWish] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'personal' | 'group'>('all')

  useEffect(() => {
    if (user) {
      loadWishlistItems()
    }
  }, [user])

  const loadWishlistItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await database.getUserWishlistItems()
      
      if (error) {
        console.error('Error loading wishlist items:', error)
        // Vis tom liste i stedet for feil
        setWishlistItems([])
        if (error.message?.includes('permission denied')) {
          toast.error('Tillatelsesproblem - sjekk RLS-innstillinger')
        } else {
          toast.error('Kunne ikke laste ønskeliste')
        }
      } else {
        setWishlistItems(data || [])
      }
    } catch (error) {
      console.error('Error loading wishlist items:', error)
      setWishlistItems([])
      toast.error('Noe gikk galt ved lasting av ønskeliste')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = wishlistItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterType === 'personal') return matchesSearch && !item.group_id
    if (filterType === 'group') return matchesSearch && item.group_id
    return matchesSearch
  })

  const personalItems = wishlistItems.filter(item => !item.group_id)
  const groupItems = wishlistItems.filter(item => item.group_id)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Logg inn for å se ønskelisten</h1>
          <p className="text-gray-600">Du må være logget inn for å se dine ønsker</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ønskeliste</h1>
              <p className="text-gray-600">
                {wishlistItems.length} ønsker • {personalItems.length} personlige • {groupItems.length} i grupper
              </p>
            </div>
            <button
              onClick={() => setShowAddWish(true)}
              className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
            >
              <Plus size={24} />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Søk i ønsker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilterType('personal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'personal' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Personlige
              </button>
              <button
                onClick={() => setFilterType('group')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'group' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Grupper
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="text-gray-400" size={48} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Ingen ønsker funnet' : 'Ingen ønsker ennå'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Prøv å endre søkeordene dine'
                : 'Legg til ditt første ønske for å komme i gang'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddWish(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Legg til ønske
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <WishlistCard
                  item={item}
                  showPurchaseOption={false}
                  onUpdate={loadWishlistItems}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Wish Modal */}
      <AddWishModal
        isOpen={showAddWish}
        onClose={() => setShowAddWish(false)}
        onSuccess={loadWishlistItems}
      />
    </div>
  )
}
