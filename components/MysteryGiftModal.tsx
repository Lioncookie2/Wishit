'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, Users, Shuffle, Plus, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface MysteryGiftModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  isAdmin: boolean
  mysteryGiftEnabled: boolean
  mysteryGiftBudget: number
  onSuccess?: () => void
}

interface MysteryGiftData {
  gift: {
    id: string
    title: string
    description: string
    current_price: number
  }
  receiver: {
    full_name: string
    email: string
  }
}

export default function MysteryGiftModal({ 
  isOpen, 
  onClose, 
  groupId, 
  isAdmin, 
  mysteryGiftEnabled, 
  mysteryGiftBudget,
  onSuccess 
}: MysteryGiftModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<'overview' | 'add_gift' | 'my_gift'>('overview')
  const [loading, setLoading] = useState(false)
  const [mysteryGiftData, setMysteryGiftData] = useState<MysteryGiftData | null>(null)
  const [giftForm, setGiftForm] = useState({
    title: '',
    description: '',
    budget: mysteryGiftBudget
  })

  useEffect(() => {
    if (isOpen && mysteryGiftEnabled) {
      loadMyMysteryGift()
    }
  }, [isOpen, mysteryGiftEnabled])

  const loadMyMysteryGift = async () => {
    try {
      const response = await fetch('/api/mystery-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, action: 'get_my_gift' })
      })

      const data = await response.json()
      if (data.success && data.data) {
        setMysteryGiftData(data.data)
        setStep('my_gift')
      }
    } catch (error) {
      console.error('Error loading mystery gift:', error)
    }
  }

  const handleEnableMysteryGift = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/mystery-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groupId, 
          action: 'enable',
          budget: giftForm.budget
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Mystery Gift aktivert! 🎁')
        onSuccess?.()
        setStep('add_gift')
      } else {
        toast.error(data.error || 'Kunne ikke aktivere Mystery Gift')
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!giftForm.title.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/mystery-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groupId, 
          action: 'add_gift',
          giftIdea: giftForm
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Gaveidé lagt til! 🎁')
        setGiftForm({ title: '', description: '', budget: mysteryGiftBudget })
        onSuccess?.()
        setStep('overview')
      } else {
        toast.error(data.error || 'Kunne ikke legge til gaveidé')
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleDraw = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/mystery-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, action: 'draw' })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Mystery Gift-trekning fullført! 🎲')
        onSuccess?.()
        loadMyMysteryGift()
      } else {
        toast.error(data.error || 'Kunne ikke trekke Mystery Gift')
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
        className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Gift className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mystery Gift</h2>
              <p className="text-sm text-gray-600">Hemmelig gaveutveksling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {!mysteryGiftEnabled ? (
                <div className="text-center py-8">
                  <Gift className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aktiver Mystery Gift
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Alle medlemmer legger inn én liten gaveidé og får en hemmelig mottaker
                  </p>
                  
                  <div className="max-w-md mx-auto space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budsjett per person
                      </label>
                      <input
                        type="number"
                        value={giftForm.budget}
                        onChange={(e) => setGiftForm(prev => ({ ...prev, budget: Number(e.target.value) }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="50"
                        max="500"
                        step="50"
                      />
                    </div>
                    
                    <button
                      onClick={handleEnableMysteryGift}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Aktiverer...' : 'Aktiver Mystery Gift'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="text-purple-600" size={20} />
                      <span className="font-semibold text-purple-800">Mystery Gift aktivert</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Budsjett: {giftForm.budget} kr per person
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setStep('add_gift')}
                      className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Plus size={24} />
                      <div className="text-left">
                        <div className="font-semibold">Legg til gaveidé</div>
                        <div className="text-sm">Beskriv din gaveidé</div>
                      </div>
                    </button>

                    <button
                      onClick={loadMyMysteryGift}
                      className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Eye size={24} />
                      <div className="text-left">
                        <div className="font-semibold">Se min gave</div>
                        <div className="text-sm">Hva skal jeg kjøpe?</div>
                      </div>
                    </button>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={handleDraw}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
                    >
                      <Shuffle size={20} />
                      {loading ? 'Trekker...' : 'Start Mystery Gift-trekning'}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {step === 'add_gift' && (
            <motion.div
              key="add_gift"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Legg til gaveidé
                </h3>
                <p className="text-gray-600">
                  Beskriv en liten gaveidé på maks {mysteryGiftBudget} kr
                </p>
              </div>

              <form onSubmit={handleAddGift} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gaveidé
                  </label>
                  <input
                    type="text"
                    value={giftForm.title}
                    onChange={(e) => setGiftForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="F.eks. 'Koselig kaffekopp'"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beskrivelse (valgfritt)
                  </label>
                  <textarea
                    value={giftForm.description}
                    onChange={(e) => setGiftForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="F.eks. 'En fin kaffekopp med juledesign'"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('overview')}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !giftForm.title.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Legger til...' : 'Legg til gaveidé'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'my_gift' && mysteryGiftData && (
            <motion.div
              key="my_gift"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Din Mystery Gift-mottaker
                </h3>
                <p className="text-gray-600">
                  Du skal kjøpe gave til:
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="text-white" size={32} />
                  </div>
                  
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {mysteryGiftData.receiver.full_name}
                  </h4>
                  
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h5 className="font-semibold text-gray-900 mb-2">
                      {mysteryGiftData.gift.title}
                    </h5>
                    {mysteryGiftData.gift.description && (
                      <p className="text-gray-600 text-sm mb-2">
                        {mysteryGiftData.gift.description}
                      </p>
                    )}
                    <p className="text-purple-600 font-semibold">
                      Budsjett: {mysteryGiftData.gift.current_price} kr
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('overview')}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Tilbake til oversikt
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
