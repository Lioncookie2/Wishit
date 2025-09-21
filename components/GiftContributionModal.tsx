'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Users, Check, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import toast from 'react-hot-toast'

interface Contribution {
  userId: string
  amount: number
  comment: string
  userName: string
  createdAt: string
}

interface GiftContributionModalProps {
  isOpen: boolean
  onClose: () => void
  wishlistItem: {
    id: string
    title: string
    current_price?: number
    price?: number
    contributions?: Contribution[]
    total_contributed?: number
    is_fully_funded?: boolean
  }
  onSuccess?: () => void
}

export default function GiftContributionModal({ 
  isOpen, 
  onClose, 
  wishlistItem, 
  onSuccess 
}: GiftContributionModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionComment, setContributionComment] = useState('')
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [totalContributed, setTotalContributed] = useState(0)
  const [isFullyFunded, setIsFullyFunded] = useState(false)

  const currentPrice = wishlistItem.current_price || wishlistItem.price || 0
  const remainingAmount = Math.max(0, currentPrice - totalContributed)

  useEffect(() => {
    if (isOpen && wishlistItem) {
      // Parse contributions from JSON string or array
      let parsedContributions: Contribution[] = []
      if (wishlistItem.contributions) {
        if (typeof wishlistItem.contributions === 'string') {
          try {
            parsedContributions = JSON.parse(wishlistItem.contributions)
          } catch (error) {
            console.error('Error parsing contributions:', error)
          }
        } else if (Array.isArray(wishlistItem.contributions)) {
          parsedContributions = wishlistItem.contributions
        }
      }
      
      setContributions(parsedContributions)
      setTotalContributed(wishlistItem.total_contributed || 0)
      setIsFullyFunded(wishlistItem.is_fully_funded || false)
    }
  }, [isOpen, wishlistItem])

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !contributionAmount.trim()) return

    const amount = parseFloat(contributionAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ugyldig beløp')
      return
    }

    if (amount > remainingAmount) {
      toast.error(`Beløpet kan ikke overstige gjenstående ${remainingAmount} kr`)
      return
    }

    setLoading(true)
    try {
      const { error } = await database.contributeToPurchase(
        wishlistItem.id, 
        user.id, 
        amount, 
        contributionComment.trim() || undefined
      )

      if (error) {
        toast.error('Kunne ikke legge til bidrag')
      } else {
        toast.success(`Bidrag på ${formatPrice(amount)} lagt til! 💰`)
        setContributionAmount('')
        setContributionComment('')
        onSuccess?.()
        onClose()
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <DollarSign className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bidra til gave</h2>
              <p className="text-sm text-gray-600">{wishlistItem.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Prisoversikt */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Totalpris</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatPrice(currentPrice)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Bidratt</p>
              <p className="text-lg font-semibold text-green-600">
                {formatPrice(totalContributed)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Gjenstår</p>
              <p className="text-lg font-semibold text-orange-600">
                {formatPrice(remainingAmount)}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (totalContributed / currentPrice) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              {Math.round((totalContributed / currentPrice) * 100)}% fullfinansiert
            </p>
          </div>
        </div>

        {/* Fullfinansiert status */}
        {isFullyFunded && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <Check className="text-green-600" size={20} />
              <span className="font-semibold text-green-800">Fullfinansiert! ✅</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Denne gaven er fullfinansiert og klar for kjøp
            </p>
          </div>
        )}

        {/* Eksisterende bidrag */}
        {contributions.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users size={16} />
              Eksisterende bidrag ({contributions.length})
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {contributions.map((contribution, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{contribution.userName}</p>
                    {contribution.comment && (
                      <p className="text-sm text-gray-600">"{contribution.comment}"</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(contribution.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(contribution.createdAt).toLocaleDateString('no-NO')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bidrag-formular */}
        {!isFullyFunded && (
          <form onSubmit={handleContribute} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beløp du vil bidra med
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder={`Maks ${remainingAmount} kr`}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="1"
                  max={remainingAmount}
                  step="1"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maksimalt beløp: {formatPrice(remainingAmount)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kommentar (valgfritt)
              </label>
              <textarea
                value={contributionComment}
                onChange={(e) => setContributionComment(e.target.value)}
                placeholder="F.eks. 'Jeg tar 400 kr'"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={loading || !contributionAmount.trim() || parseFloat(contributionAmount) > remainingAmount}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Bidrar...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Legg til bidrag
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {isFullyFunded && (
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Lukk
          </button>
        )}
      </motion.div>
    </div>
  )
}
