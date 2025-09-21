'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import { WishlistItem, Group } from '@/types'
import toast from 'react-hot-toast'

interface EditWishModalProps {
  isOpen: boolean
  onClose: () => void
  wishlistItem: WishlistItem
  onSuccess?: () => void
}

export default function EditWishModal({ isOpen, onClose, wishlistItem, onSuccess }: EditWishModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [formData, setFormData] = useState({
    title: wishlistItem.title || '',
    description: wishlistItem.description || '',
    price: wishlistItem.current_price ? wishlistItem.current_price.toString() : wishlistItem.price?.toString() || '',
    url: wishlistItem.url || '',
  })

  useEffect(() => {
    if (isOpen && user) {
      loadGroups()
    }
  }, [isOpen, user])

  const loadGroups = async () => {
    if (!user) return
    
    try {
      const { data, error } = await database.getUserGroups()
      if (error) {
        console.error('Feil ved lasting av grupper:', error)
      } else {
        setGroups(data || [])
      }
    } catch (error) {
      console.error('Feil ved lasting av grupper:', error)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.title.trim()) return

    setLoading(true)
    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        current_price: formData.price ? parseFloat(formData.price) : null,
        url: formData.url.trim() || null,
      }

      const { error } = await database.updateWishlistItem(wishlistItem.id, updateData)

      if (error) {
        console.error('Error updating wishlist item:', error)
        toast.error('Kunne ikke oppdatere ønsket')
      } else {
        toast.success('Ønsket ble oppdatert!')
        onSuccess?.()
        onClose()
      }
    } catch (error) {
      console.error('Error updating wishlist item:', error)
      toast.error('Noe gikk galt ved oppdatering')
    }
    setLoading(false)
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-4">✏️</div>
          <h2 className="text-2xl font-bold text-gray-900">
            Rediger ønske
          </h2>
          <p className="text-gray-600 mt-2">
            Oppdater informasjonen om ønsket ditt
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Navn på gave *
            </label>
            <input
              type="text"
              placeholder="F.eks. iPhone 15 Pro"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beskrivelse
            </label>
            <textarea
              placeholder="Beskrivelse av ønsket..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pris (kr)
            </label>
            <input
              type="number"
              placeholder="F.eks. 1299"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lenke (valgfritt)
            </label>
            <input
              type="url"
              placeholder="https://www.elkjop.no/produkt/..."
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-500 mt-0.5" size={20} />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Tips</h4>
                <p className="text-sm text-blue-700">
                  Du kan oppdatere alle felter. Hvis du endrer prisen, vil den nye prisen bli brukt for prisoppfølging.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Lagrer...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Lagre endringer
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
