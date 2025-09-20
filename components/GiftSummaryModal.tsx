'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, Heart, MessageCircle, Calendar, User } from 'lucide-react'
import { WishlistItem } from '@/types'
import { database } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'

interface GiftSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  groupId?: string
}

export default function GiftSummaryModal({ isOpen, onClose, groupId }: GiftSummaryModalProps) {
  const { user } = useAuth()
  const [gifts, setGifts] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      loadGiftSummary()
    }
  }, [isOpen, user, groupId])

  const loadGiftSummary = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Hent alle ønsker som er kjøpt for denne brukeren
      const { data: wishlists, error } = await database.getUserWishlists(user.id, groupId)
      
      if (error) {
        console.error('Error loading gift summary:', error)
        return
      }

      // Filtrer kun kjøpte gaver
      const purchasedGifts = wishlists?.filter((item: any) => item.is_purchased) || []
      setGifts(purchasedGifts)
    } catch (error) {
      console.error('Error loading gift summary:', error)
    }
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getTotalValue = () => {
    return gifts.reduce((total, gift) => total + (gift.price || 0), 0)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="text-white" size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Din gaveoversikt
              </h2>
              <p className="text-gray-600">
                Her er alle gavene du har mottatt i år
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : gifts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ingen gaver mottatt ennå
                </h3>
                <p className="text-gray-600">
                  Når noen kjøper dine ønsker, vil de vises her
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Statistikk */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {gifts.length}
                      </div>
                      <div className="text-sm text-gray-600">Gaver mottatt</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {new Intl.NumberFormat('no-NO', {
                          style: 'currency',
                          currency: 'NOK',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(getTotalValue())}
                      </div>
                      <div className="text-sm text-gray-600">Total verdi</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {gifts.filter(g => g.thank_you_message).length}
                      </div>
                      <div className="text-sm text-gray-600">Takk sendt</div>
                    </div>
                  </div>
                </div>

                {/* Gaveliste */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Mottatte gaver
                  </h3>
                  {gifts.map((gift) => (
                    <motion.div
                      key={gift.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        {/* Gavebilde */}
                        <div className="flex-shrink-0">
                          {gift.image_url ? (
                            <img
                              src={gift.image_url}
                              alt={gift.title}
                              className="w-20 h-20 object-cover rounded-xl"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                              <Gift className="text-gray-400" size={32} />
                            </div>
                          )}
                        </div>

                        {/* Gaveinfo */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {gift.title}
                          </h4>
                          {gift.description && (
                            <p className="text-gray-600 mb-3 line-clamp-2">
                              {gift.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            {gift.price && (
                              <span className="font-semibold text-green-600">
                                {new Intl.NumberFormat('no-NO', {
                                  style: 'currency',
                                  currency: 'NOK',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(gift.price)}
                              </span>
                            )}
                            {gift.purchased_at && (
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>Kjøpt {formatDate(gift.purchased_at)}</span>
                              </div>
                            )}
                          </div>

                          {/* Giver info */}
                          {gift.purchaser && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <User size={16} />
                              <span>Fra {gift.purchaser.full_name || gift.purchaser.email}</span>
                            </div>
                          )}

                          {/* Kommentar fra giver */}
                          {gift.purchase_comment && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                              <div className="flex items-start gap-2">
                                <MessageCircle className="text-blue-500 mt-0.5" size={16} />
                                <div>
                                  <div className="text-sm font-medium text-blue-900 mb-1">
                                    Kommentar fra giveren:
                                  </div>
                                  <div className="text-sm text-blue-800">
                                    {gift.purchase_comment}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Takk-melding */}
                          {gift.thank_you_message ? (
                            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Heart className="text-pink-500 mt-0.5" size={16} />
                                <div>
                                  <div className="text-sm font-medium text-pink-900 mb-1">
                                    Din takk-melding:
                                  </div>
                                  <div className="text-sm text-pink-800">
                                    {gift.thank_you_message}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              Du har ikke sendt takk for denne gaven ennå
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
