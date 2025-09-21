'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Gift, Edit, Trash2, ShoppingCart, Check, MessageCircle, Heart, Users, Crown, DollarSign } from 'lucide-react'
import { WishlistItem } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import toast from 'react-hot-toast'
import he from 'he'
import GiftContributionModal from './GiftContributionModal'
import EditWishModal from './EditWishModal'

interface WishlistCardProps {
  item: WishlistItem
  showPurchaseOption?: boolean
  onUpdate?: () => void
  onDelete?: () => void
  isPremium?: boolean
}

export default function WishlistCard({ 
  item, 
  showPurchaseOption = false, 
  onUpdate,
  onDelete,
  isPremium = false
}: WishlistCardProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showThankYouModal, setShowThankYouModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [showGiftContributionModal, setShowGiftContributionModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [purchaseComment, setPurchaseComment] = useState('')
  const [thankYouMessage, setThankYouMessage] = useState('')
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionComment, setContributionComment] = useState('')
  const [purchaseType, setPurchaseType] = useState<'full' | 'contribute'>('full')
  const [contributions, setContributions] = useState<any[]>([])
  const [totalContributed, setTotalContributed] = useState(0)
  const [remainingAmount, setRemainingAmount] = useState(0)

  const isOwnItem = user?.id === item.user_id
  const canPurchase = showPurchaseOption && !isOwnItem && !item.is_purchased
  const canSeePurchaseInfo = !isOwnItem && item.is_purchased

  const handlePurchase = async () => {
    if (!user || !canPurchase) return

    setLoading(true)
    try {
      if (purchaseType === 'full') {
        const { error } = await database.markAsPurchased(item.id, user.id, purchaseComment)
        if (error) {
          toast.error('Kunne ikke markere som kjøpt')
        } else {
          toast.success('Markert som kjøpt! 🎁')
          setShowPurchaseModal(false)
          setPurchaseComment('')
          onUpdate?.()
        }
      } else {
        // Dette skal ikke skje lenger siden vi har handleContribute
        toast.error('Uventet feil')
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleContribute = async () => {
    if (!user || !canPurchase) return

    const amount = parseFloat(contributionAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ugyldig beløp')
      return
    }

    setLoading(true)
    try {
      const { error } = await database.contributeToPurchase(item.id, user.id, amount, contributionComment)
      if (error) {
        toast.error('Kunne ikke bidra til kjøp')
      } else {
        toast.success(`Bidratt ${formatPrice(amount)} til kjøpet! 💰`)
        setShowContributeModal(false)
        setContributionAmount('')
        setContributionComment('')
        onUpdate?.()
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleThankYou = async () => {
    if (!user || !isOwnItem) return

    setLoading(true)
    try {
      const { error } = await database.addThankYouMessage(item.id, thankYouMessage)
      if (error) {
        toast.error('Kunne ikke sende takk-melding')
      } else {
        toast.success('Takk-melding sendt! 💝')
        setShowThankYouModal(false)
        setThankYouMessage('')
        onUpdate?.()
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!isOwnItem) return

    if (!confirm('Er du sikker på at du vil slette dette ønsket?')) return

    setLoading(true)
    try {
      const { error } = await database.deleteWishlistItem(item.id)
      if (error) {
        toast.error('Kunne ikke slette ønsket')
      } else {
        toast.success('Ønske slettet')
        onDelete?.()
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg border-2 overflow-hidden transition-all duration-300 hover:shadow-xl ${
        item.is_purchased 
          ? 'border-green-200 bg-green-50' 
          : 'border-gray-200 hover:border-christmas-red/30'
      }`}
    >
      {/* Kjøpt banner */}
      {item.is_purchased && (
        <div className="bg-green-500 text-white px-4 py-2 text-center text-sm font-medium">
          <Check className="inline mr-2" size={16} />
          Kjøpt av {item.purchased_by === user?.id ? 'deg' : 'noen andre'}
        </div>
      )}

      <div className="p-6">
        {/* Bilde og basis-info */}
        <div className="flex gap-4 mb-4">
          {item.image_url && !imageError ? (
            <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <Gift className="text-gray-400" size={24} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
              {he.decode(item.title)}
            </h3>
            {item.store_name && (
              <p className="text-sm text-gray-500 mb-1">
                fra {item.store_name}
              </p>
            )}
        {(item.current_price || item.price) && (
          <div className="space-y-1">
            <p className="text-lg font-bold text-christmas-red">
              Ønskepris: {formatPrice(item.current_price || item.price || 0)}
            </p>
            {item.previous_price && item.previous_price > (item.current_price || item.price || 0) && (
              <p className="text-sm text-green-600 font-medium">
                📉 Prisfall! Tidligere {formatPrice(item.previous_price)}
              </p>
            )}
            {item.last_price_check && (
              <p className="text-xs text-gray-500">
                Sist sjekket: {new Date(item.last_price_check).toLocaleDateString('no-NO')}
              </p>
            )}
            
            {/* Bidrag-visning */}
            {item.total_contributed && item.total_contributed > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Bidrag</span>
                  <span className="text-sm font-semibold text-blue-900">
                    {formatPrice(item.total_contributed)} / {formatPrice(item.current_price || item.price || 0)}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, ((item.total_contributed || 0) / (item.current_price || item.price || 1)) * 100)}%` 
                    }}
                  />
                </div>
                {item.is_fully_funded && (
                  <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                    <Check size={12} />
                    Fullfinansiert! ✅
                  </p>
                )}
              </div>
            )}
          </div>
        )}
          </div>
        </div>

        {/* Beskrivelse */}
        {item.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {he.decode(item.description)}
          </p>
        )}

        {/* Eier info (hvis ikke egen) */}
        {!isOwnItem && item.owner && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <div className="w-6 h-6 bg-christmas-green text-white rounded-full flex items-center justify-center text-xs font-bold">
              {item.owner.full_name?.[0] || item.owner.email[0].toUpperCase()}
            </div>
            <span>Ønskes av {he.decode(item.owner.full_name || item.owner.email)}</span>
          </div>
        )}

        {/* Handlinger */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-christmas-red hover:text-red-600 text-sm font-medium"
          >
            <ExternalLink size={16} />
            Se produkt
          </a>

          <div className="flex items-center gap-2">
            {canPurchase && (
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setPurchaseType('full')
                    setShowPurchaseModal(true)
                  }}
                  className="bg-christmas-green text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Kjøp hele
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowGiftContributionModal(true)}
                  className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <DollarSign size={16} />
                  Bidra
                </motion.button>
              </div>
            )}

            {canSeePurchaseInfo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <Check size={16} />
                    <span>Kjøpt</span>
                  </div>
                  {item.purchase_comment && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <MessageCircle size={14} />
                      <span>Kommentar</span>
                    </div>
                  )}
                </div>
                {item.purchase_comment && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      {item.purchase_comment.split('\n').map((line, index) => (
                        <div key={index}>{he.decode(line)}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isOwnItem && item.is_purchased && !item.thank_you_message && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowThankYouModal(true)}
                className="bg-pink-100 text-pink-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-pink-200 transition-colors flex items-center gap-2"
              >
                <Heart size={16} />
                Takk
              </motion.button>
            )}

            {/* Status badges */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {item.is_purchased ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Check size={12} />
                  Kjøpt
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  <Gift size={12} />
                  Ukjøpt
                </span>
              )}
              
              {item.group_id && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Users size={12} />
                  Gruppe
                </span>
              )}
              
              {(item.current_price || item.price) && isPremium && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {formatPrice(item.current_price || item.price || 0)}
                </span>
              )}
              {(item.current_price || item.price) && !isPremium && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  <Crown size={12} />
                  Premium
                </span>
              )}
            </div>

            {isOwnItem && (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                  title="Rediger"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-gray-400 hover:text-red-500 p-2"
                  title="Slett"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Kjøp Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {purchaseType === 'full' ? 'Marker som kjøpt' : 'Bidra til kjøp'}
            </h3>
            <div className="space-y-4">
              {purchaseType === 'full' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kommentar (valgfritt)
                  </label>
                  <textarea
                    value={purchaseComment}
                    onChange={(e) => setPurchaseComment(e.target.value)}
                    placeholder="Legg til en kommentar om gaven..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-green focus:border-transparent"
                    rows={3}
                  />
                </div>
              )}
              {purchaseType === 'contribute' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beløp du vil bidra med
                    </label>
                    <input
                      type="number"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      placeholder="F.eks. 400"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kommentar (valgfritt)
                    </label>
                    <textarea
                      value={contributionComment}
                      onChange={(e) => setContributionComment(e.target.value)}
                      placeholder="F.eks. 'Jeg kan bidra med 400kr'"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="flex-1 bg-christmas-green text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Markerer...' : purchaseType === 'full' ? 'Marker som kjøpt' : 'Bidra'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bidrag Modal */}
      {showContributeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bidra til kjøp</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beløp du vil bidra med
                </label>
                <input
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="F.eks. 400"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kommentar (valgfritt)
                </label>
                <textarea
                  value={contributionComment}
                  onChange={(e) => setContributionComment(e.target.value)}
                  placeholder="F.eks. 'Jeg kan bidra med 400kr'"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowContributeModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleContribute}
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Bidrar...' : 'Bidra'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Takk Modal */}
      {showThankYouModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send takk-melding</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Takk-melding
                </label>
                <textarea
                  value={thankYouMessage}
                  onChange={(e) => setThankYouMessage(e.target.value)}
                  placeholder="Takk for gaven! 💝"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowThankYouModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleThankYou}
                  disabled={loading || !thankYouMessage.trim()}
                  className="flex-1 bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sender...' : 'Send takk'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gift contribution modal */}
      <GiftContributionModal
        isOpen={showGiftContributionModal}
        onClose={() => setShowGiftContributionModal(false)}
        wishlistItem={item}
        onSuccess={onUpdate}
      />

      {/* Edit wish modal */}
      <EditWishModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        wishlistItem={item}
        onSuccess={onUpdate}
      />
    </motion.div>
  )
}
