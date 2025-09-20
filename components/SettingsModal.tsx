'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, User, Camera, Trash2, Settings, Bell, Mail, Shield, Palette } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function SettingsModal({ isOpen, onClose, onSuccess }: SettingsModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile')
  const [profileData, setProfileData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    workplace: user?.user_metadata?.workplace || '',
    address: user?.user_metadata?.address || '',
    phone: user?.user_metadata?.phone || '',
    bio: user?.user_metadata?.bio || ''
  })
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    purchase_alerts: true,
    group_updates: true
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Valider filtype
    if (!file.type.startsWith('image/')) {
      toast.error('Kun bilder er tillatt')
      return
    }

    // Valider filstørrelse (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bildet er for stort. Maksimal størrelse er 5MB')
      return
    }

    setUploading(true)
    try {
      // Konverter til base64 for enkel lagring
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        
        // Oppdater profil med nytt avatar
        const { error } = await database.updateProfile(user.id, {
          avatar_url: base64
        })

        if (error) {
          toast.error('Kunne ikke oppdatere profilbilde')
        } else {
          toast.success('Profilbilde oppdatert! 🎉')
          onSuccess?.()
        }
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error('Noe gikk galt ved opplasting')
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await database.updateProfile(user.id, {
        avatar_url: undefined
      })

      if (error) {
        toast.error('Kunne ikke fjerne profilbilde')
      } else {
        toast.success('Profilbilde fjernet')
        onSuccess?.()
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleProfileUpdate = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Oppdater profil i database
      const { error: profileError } = await database.updateProfile(user.id, {
        full_name: profileData.full_name,
        workplace: profileData.workplace,
        address: profileData.address,
        phone: profileData.phone,
        bio: profileData.bio
      } as any)

      if (profileError) {
        console.error('Profile update error:', profileError)
        toast.error('Kunne ikke oppdatere profil')
        return
      }

      // Oppdater user metadata i Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          workplace: profileData.workplace,
          address: profileData.address,
          phone: profileData.phone,
          bio: profileData.bio
        } as any
      })

      if (authError) {
        console.error('Auth update error:', authError)
        toast.error('Kunne ikke oppdatere brukerdata')
        return
      }

      toast.success('Profil oppdatert! 🎉')
      onSuccess?.()
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    toast.success('Innstilling lagret! 💾')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-2xl relative max-h-[95vh] overflow-y-auto mx-2 sm:mx-0"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Innstillinger
              </h2>
              <p className="text-gray-600">
                Administrer din profil og app-innstillinger
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User size={16} className="inline mr-2" />
                Profil
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Bell size={16} className="inline mr-2" />
                Varsler
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'privacy'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield size={16} className="inline mr-2" />
                Personvern
              </button>
            </div>

            <div className="space-y-6">
              {activeTab === 'profile' && (
                <>
                  {/* Profilbilde seksjon */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User size={20} />
                      Profilbilde
                    </h3>
                
                <div className="flex flex-col items-center space-y-4">
                  {/* Nåværende avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      {user?.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="Profilbilde"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="text-gray-400" size={32} />
                      )}
                    </div>
                  </div>

                  {/* Upload knapper */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleUploadClick}
                      disabled={uploading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Laster opp...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Last opp bilde
                        </>
                      )}
                    </motion.button>

                    {user?.user_metadata?.avatar_url && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRemoveAvatar}
                        disabled={loading}
                        className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Fjern
                      </motion.button>
                    )}
                  </div>

                    <p className="text-xs text-gray-500 text-center">
                      Støttede formater: JPG, PNG, GIF<br />
                      Maksimal størrelse: 5MB
                    </p>
                  </div>
                </div>

                {/* Profilinformasjon */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User size={20} />
                    Profilinformasjon
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fullt navn
                      </label>
                      <input
                        type="text"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ditt fulle navn"
                      />
                    </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              E-post
                            </label>
                            <input
                              type="email"
                              value={profileData.email}
                              disabled
                              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">E-post kan ikke endres</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Arbeidsgiver/Arbeidssted
                            </label>
                            <input
                              type="text"
                              value={profileData.workplace}
                              onChange={(e) => setProfileData(prev => ({ ...prev, workplace: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="F.eks. Universitetet i Oslo"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Adresse
                            </label>
                            <input
                              type="text"
                              value={profileData.address}
                              onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Din adresse for levering"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Telefonnummer
                            </label>
                            <input
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="+47 123 45 678"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bio/Beskrivelse
                            </label>
                            <textarea
                              value={profileData.bio}
                              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Fortell litt om deg selv..."
                              rows={3}
                            />
                          </div>
                    <button
                      onClick={handleProfileUpdate}
                      disabled={loading}
                      className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Lagrer...' : 'Lagre endringer'}
                    </button>
                  </div>
                </div>
              </>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Bell size={20} />
                      Varslingsinnstillinger
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700 font-medium">Push-varsler</span>
                          <p className="text-sm text-gray-500">Få notifikasjoner i nettleseren</p>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle('push')}
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            notifications.push ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            notifications.push ? 'right-0.5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700 font-medium">E-post varsler</span>
                          <p className="text-sm text-gray-500">Få varsler på e-post</p>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle('email')}
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            notifications.email ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            notifications.email ? 'right-0.5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700 font-medium">Kjøp-varsler</span>
                          <p className="text-sm text-gray-500">Få beskjed når noen kjøper dine ønsker</p>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle('purchase_alerts')}
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            notifications.purchase_alerts ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            notifications.purchase_alerts ? 'right-0.5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700 font-medium">Gruppe-oppdateringer</span>
                          <p className="text-sm text-gray-500">Få beskjed om endringer i gruppene dine</p>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle('group_updates')}
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            notifications.group_updates ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            notifications.group_updates ? 'right-0.5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield size={20} />
                      Personverninnstillinger
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700 font-medium">Profil synlig for andre</span>
                          <p className="text-sm text-gray-500">La andre se din profil i grupper</p>
                        </div>
                        <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700 font-medium">E-post synlig for gruppemedlemmer</span>
                          <p className="text-sm text-gray-500">La gruppemedlemmer se din e-post</p>
                        </div>
                        <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-red-900 mb-2">Farlig sone</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Disse handlingene kan ikke angres
                    </p>
                    <button className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                      Slett konto
                    </button>
                  </div>
                </div>
              )}

              {/* Skjult fil input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
