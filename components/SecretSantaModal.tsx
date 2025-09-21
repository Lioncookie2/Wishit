'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Shuffle, DollarSign, Users, Crown } from 'lucide-react'
import { database } from '@/lib/database'
import toast from 'react-hot-toast'

interface SecretSantaModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  onSuccess?: () => void
}

export default function SecretSantaModal({ isOpen, onClose, groupId, onSuccess }: SecretSantaModalProps) {
  const [budget, setBudget] = useState(500)
  const [loading, setLoading] = useState(false)

  const handleCreateSecretSanta = async () => {
    if (budget < 1) {
      toast.error('Budsjett må være minst 1 kr')
      return
    }

    setLoading(true)
    try {
      const { error } = await database.createSecretSantaDraw(groupId, budget)
      if (error) {
        toast.error(error.message || 'Kunne ikke opprette Secret Santa')
      } else {
        toast.success('Secret Santa trekning opprettet! 🎅')
        onSuccess?.()
        onClose()
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-green-500 rounded-xl flex items-center justify-center">
              <Shuffle className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Secret Santa Pro</h2>
              <p className="text-sm text-gray-600">Premium gaveutveksling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Premium badge */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="text-amber-600" size={20} />
            <span className="text-sm font-semibold text-amber-800">Premium-funksjon</span>
          </div>
          <p className="text-sm text-amber-700">
            Secret Santa er tilgjengelig for premium-medlemmer
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budsjett per person
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                placeholder="500"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="1"
                step="1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Hver deltaker får et budsjett på {budget} kr
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-blue-600" size={20} />
              <span className="text-sm font-semibold text-blue-800">Hvordan det fungerer</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Systemet trekker tilfeldig hvem som skal kjøpe til hvem</li>
              <li>• Hver deltaker får kun opp sin egen mottaker</li>
              <li>• Administratoren kan se alle tildelinger</li>
              <li>• Budsjettet gjelder per person</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleCreateSecretSanta}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-500 to-green-500 text-white py-3 rounded-lg font-medium hover:from-red-600 hover:to-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Oppretter...
                </>
              ) : (
                <>
                  <Shuffle size={18} />
                  Start Secret Santa
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
