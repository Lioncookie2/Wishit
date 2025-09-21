'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link, Search, Gift, AlertCircle, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import { ProductMetadata, Group } from '@/types'
import toast from 'react-hot-toast'

interface AddWishModalProps {
  isOpen: boolean
  onClose: () => void
  groupId?: string
  onSuccess?: () => void
}

export default function AddWishModal({ isOpen, onClose, groupId, onSuccess }: AddWishModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<'input' | 'details'>('input')
  const [inputType, setInputType] = useState<'url' | 'manual'>('url')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [productData, setProductData] = useState<ProductMetadata | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupId || null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
  })

  // Last grupper når modalen åpnes
  useEffect(() => {
    if (isOpen && user && !groupId) {
      loadGroups()
    }
  }, [isOpen, user, groupId])

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

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (inputType === 'url' && !url.trim()) return
    if (inputType === 'manual' && !formData.title.trim()) return

    if (inputType === 'manual') {
      // Gå direkte til details for manuell input
      setStep('details')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setProductData(data)
        setFormData({
          title: data.title || '',
          description: data.description || '',
          price: data.current_price ? data.current_price.toString() : '',
        })
        setStep('details')
      } else {
        toast.error(data.error || 'Kunne ikke hente produktinformasjon')
      }
    } catch (error) {
      toast.error('Noe gikk galt ved henting av produktinformasjon')
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.title.trim()) return

    setLoading(true)
    try {
      const wishlistItem = {
        user_id: user.id,
        group_id: selectedGroupId || undefined,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        url: url.trim(),
        price: formData.price ? parseFloat(formData.price) : undefined, // Bakoverkompatibilitet
        current_price: (productData as any)?.current_price || (formData.price ? parseFloat(formData.price) : undefined),
        previous_price: undefined, // Vil bli satt ved prisoppdatering
        price_provider: (productData as any)?.provider || 'manual',
        last_price_check: new Date().toISOString(),
        price_drop_notification_sent: false,
        image_url: productData?.image || undefined,
        store_name: (productData as any)?.store_name || productData?.siteName || undefined,
        is_purchased: false,
      }

      const { error } = await database.createWishlistItem(wishlistItem)

      if (error) {
        toast.error('Kunne ikke legge til ønske')
      } else {
        toast.success('Ønske lagt til! 🎁')
        onSuccess?.()
        handleClose()
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleClose = () => {
    setStep('input')
    setUrl('')
    setProductData(null)
    setSelectedGroupId(groupId || null)
    setFormData({ title: '', description: '', price: '' })
    onClose()
  }

  const handleBack = () => {
    setStep('input')
    setProductData(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
              <div className="text-4xl mb-4">🎁</div>
              <h2 className="text-2xl font-bold text-christmas-green">
                Legg til ønske
              </h2>
              <p className="text-gray-600 mt-2">
                {step === 'input' 
                  ? 'Velg hvordan du vil legge til ønsket' 
                  : 'Sjekk og juster informasjonen'
                }
              </p>
            </div>

            {step === 'input' ? (
              <div className="space-y-4">
                {/* Input Type Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInputType('url')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'url' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Link className="mx-auto mb-2" size={24} />
                    <p className="font-medium">Fra lenke</p>
                    <p className="text-xs text-gray-500">Hent automatisk</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setInputType('manual')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'manual' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Gift className="mx-auto mb-2" size={24} />
                    <p className="font-medium">Manuelt</p>
                    <p className="text-xs text-gray-500">Skriv selv</p>
                  </button>
                </div>

                <form onSubmit={handleInputSubmit} className="space-y-4">
                  {inputType === 'url' ? (
                    <>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="url"
                          placeholder="https://www.elkjop.no/produkt/..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="text-blue-500 mt-0.5" size={20} />
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">Støttede nettsteder</h4>
                            <p className="text-sm text-blue-700">
                              Elkjøp, Komplett, Power, Expert, Eplehuset, Amazon og flere
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Navn på gave *
                        </label>
                        <input
                          type="text"
                          placeholder="F.eks. iPhone 15 Pro"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lenke (valgfritt)
                        </label>
                        <input
                          type="url"
                          placeholder="https://www.elkjop.no/produkt/..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (inputType === 'url' ? !url.trim() : !formData.title.trim())}
                    className="w-full bg-gradient-to-r from-christmas-red to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Henter produktinfo...
                      </>
                    ) : (
                      <>
                        <Search size={20} />
                        {inputType === 'url' ? 'Hent produktinfo' : 'Fortsett'}
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                {/* Produktforhandsvisning */}
                {productData && (
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex gap-3">
                      {productData.image ? (
                        <img
                          src={productData.image}
                          alt={productData.title}
                          className="w-16 h-16 object-cover rounded-lg bg-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Gift className="text-gray-400" size={24} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 line-clamp-2">
                          {productData.title}
                        </p>
                        {productData.siteName && (
                          <p className="text-sm text-gray-500">
                            fra {productData.siteName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gruppevalg - kun hvis ikke allerede valgt gruppe */}
                {!groupId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legg til i gruppe
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="group"
                          value=""
                          checked={selectedGroupId === null}
                          onChange={() => setSelectedGroupId(null)}
                          className="text-blue-600"
                        />
                        <div className="flex items-center gap-2">
                          <Gift className="text-gray-500" size={20} />
                          <span className="font-medium">Personlige ønsker</span>
                        </div>
                      </label>
                      
                      {groups.map((group) => (
                        <label key={group.id} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="group"
                            value={group.id}
                            checked={selectedGroupId === group.id}
                            onChange={() => setSelectedGroupId(group.id)}
                            className="text-blue-600"
                          />
                            <div className="flex items-center gap-2">
                              <Users className="text-blue-500" size={20} />
                              <span className="font-medium">{group.name}</span>
                            </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tittel *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beskrivelse
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                    placeholder="Skriv litt om hvorfor du ønsker deg dette..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pris (kr)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Tilbake
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.title.trim()}
                    className="flex-1 bg-gradient-to-r from-christmas-green to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Legger til...' : 'Legg til ønske'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
