'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Users, Gift, Bell, Settings, LogOut, Crown, Home, Search, Heart, Check, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import { Group, WishlistItem } from '@/types'
import GroupCard from '@/components/GroupCard'
import CreateGroupModal from '@/components/CreateGroupModal'
import JoinGroupModal from '@/components/JoinGroupModal'
import ShareGroupModal from '@/components/ShareGroupModal'
import SettingsModal from '@/components/SettingsModal'
import WishlistCard from '@/components/WishlistCard'
import AddWishModal from '@/components/AddWishModal'
import PremiumBanner from '@/components/PremiumBanner'
import SecretSantaModal from '@/components/SecretSantaModal'
import MysteryGiftModal from '@/components/MysteryGiftModal'
import AuthDebug from '@/components/AuthDebug'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const router = useRouter()
  const { user, signOut, isPremium } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [personalWishlists, setPersonalWishlists] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [showShareGroup, setShowShareGroup] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showAddWish, setShowAddWish] = useState(false)
  const [showSecretSantaModal, setShowSecretSantaModal] = useState(false)
  const [selectedGroupForSecretSanta, setSelectedGroupForSecretSanta] = useState<string | null>(null)
  const [showMysteryGiftModal, setShowMysteryGiftModal] = useState(false)
  const [selectedGroupForMysteryGift, setSelectedGroupForMysteryGift] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'groups' | 'personal'>('groups')
  const [bottomNavActive, setBottomNavActive] = useState<'home' | 'groups' | 'wishes' | 'premium'>('home')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Last grupper
      const { data: groupsData, error: groupsError } = await database.getUserGroups()
      if (groupsError) {
        console.error('Feil ved lasting av grupper:', groupsError)
        toast.error('Kunne ikke laste grupper. Sjekk at databasen er satt opp riktig.')
      } else {
        setGroups(groupsData || [])
      }

      // Last personlige ønskelister
      const { data: wishlistsData, error: wishlistsError } = await database.getUserWishlists(user.id)
      if (wishlistsError) {
        console.error('Feil ved lasting av ønskelister:', wishlistsError)
        toast.error('Kunne ikke laste ønskelister. Sjekk at databasen er satt opp riktig.')
      } else {
        setPersonalWishlists(wishlistsData || [])
      }
    } catch (error) {
      console.error('Feil ved lasting av data:', error)
      toast.error('Kunne ikke laste data')
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Du er nå logget ut')
  }

  const handleSecretSantaClick = (groupId: string) => {
    setSelectedGroupForSecretSanta(groupId)
    setShowSecretSantaModal(true)
  }

  const handleMysteryGiftClick = (groupId: string) => {
    setSelectedGroupForMysteryGift(groupId)
    setShowMysteryGiftModal(true)
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Handle bottom navigation
  useEffect(() => {
    if (bottomNavActive === 'groups') {
      setActiveTab('groups')
    } else if (bottomNavActive === 'wishes') {
      setActiveTab('personal')
    }
  }, [bottomNavActive])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-christmas-red"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Gift className="text-white" size={24} />
              </div>
              <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Wishit
                  </h1>
                <div className="hidden md:flex items-center gap-1 text-sm text-gray-600">
                  <span>Velkommen,</span>
                  <span className="font-medium">{user.user_metadata?.full_name || user.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Statistikk */}
              <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Gift size={16} />
                  <span>{personalWishlists.length + groups.reduce((sum, g) => sum + (g.wishlistCount || 0), 0)} ønsker</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{groups.length} grupper</span>
                </div>
              </div>

                <div className="flex items-center gap-2">
                  <button className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Bell size={18} />
                  </button>
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="p-3 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Logg ut"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Auth Debug - kun i development */}
        {process.env.NODE_ENV === 'development' && <AuthDebug />}

        {/* Premium banner for ikke-premium brukere */}
        {user && !user.user_metadata?.is_premium && (
          <PremiumBanner
            onUpgrade={() => toast('Premium-oppgradering kommer snart!', { icon: 'ℹ️' })}
          />
        )}

        {/* Navigasjon */}
        {/* Sticky Navigation Bar */}
        <div className="sticky top-20 z-30 mb-8">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-gray-200/50">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Navigation Tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'groups'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users size={16} />
                  Grupper ({groups.length})
                </button>
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'personal'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Gift size={16} />
                  Mine ønsker ({personalWishlists.length})
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {activeTab === 'groups' && (
                  <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors shadow-sm min-h-[44px]"
            >
              <Plus size={16} />
              + Gruppe
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowJoinGroup(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm min-h-[44px]"
            >
              <Users size={16} />
              Bli med
            </motion.button>
                  </>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddWish(true)}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors shadow-sm min-h-[44px]"
                >
                  <Plus size={16} />
                  + Ønske
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <p className="text-gray-600 font-medium">Laster data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Grupper fane */}
            {activeTab === 'groups' && (
              <div>
                {groups.length === 0 ? (
                  <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="text-blue-500" size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Ingen grupper ennå
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Opprett din første gruppe for å dele ønskelister med familie og venner
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreateGroup(true)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg"
                    >
                      Opprett første gruppe
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        memberCount={group.members?.length || 0}
                        wishlistCount={group.wishlistCount || 0}
                        onClick={() => {
                          router.push(`/group/${group.id}`)
                        }}
                        onShare={(group) => {
                          setSelectedGroup(group)
                          setShowShareGroup(true)
                        }}
                        onAddWish={(groupId) => {
                          setShowAddWish(true)
                          // TODO: Pass groupId to AddWishModal
                        }}
                        onSecretSanta={handleSecretSantaClick}
                        onMysteryGift={handleMysteryGiftClick}
                        isPremium={isPremium}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Personlige ønsker fane */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                {personalWishlists.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Gift className="text-green-400" size={40} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Ingen personlige ønsker ennå
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Legg til dine første ønsker for å komme i gang
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddWish(true)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg"
                    >
                      Legg til ønske
                    </motion.button>
                  </div>
                ) : (
                  <>
                    {/* Statistikk for personlige ønsker */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Mine ønsker</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Gift size={16} />
                            <span>{personalWishlists.length} totalt</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check size={16} />
                            <span>{personalWishlists.filter(item => item.is_purchased).length} kjøpt</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${personalWishlists.length > 0 ? (personalWishlists.filter(item => item.is_purchased).length / personalWishlists.length) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {personalWishlists.length > 0 
                          ? `${Math.round((personalWishlists.filter(item => item.is_purchased).length / personalWishlists.length) * 100)}% av ønskene dine er kjøpt`
                          : 'Ingen ønsker ennå'
                        }
                      </p>
                    </div>

                    {/* Ønskeliste */}
                    <div className="space-y-4">
                      {personalWishlists.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
                              {item.description && (
                                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                              )}
                              
                              {/* Gruppe info */}
                              <div className="flex items-center gap-2 mb-3">
                                {item.group_id ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Users size={12} />
                                    Gruppe-ønske
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <Gift size={12} />
                                    Personlig ønske
                                  </span>
                                )}
                                
                                {item.is_purchased && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <Check size={12} />
                                    Kjøpt
                                  </span>
                                )}
                                
                                {item.price && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {formatPrice(item.price)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Åpne lenke"
                              >
                                <ExternalLink size={16} />
                              </a>
                            </div>
                          </div>
                          
                          {item.image_url && (
                            <div className="mb-4">
                              <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          {item.purchase_comment && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                              <div className="text-sm text-blue-800">
                                <strong>Kommentar fra giveren:</strong>
                                <div className="mt-1">
                                  {item.purchase_comment.split('\n').map((line, index) => (
                                    <div key={index}>{line}</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Opprettet {new Date(item.created_at).toLocaleDateString('no-NO')}</span>
                            {item.store_name && (
                              <span>Fra {item.store_name}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modaler */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSuccess={loadData}
      />

      <JoinGroupModal
        isOpen={showJoinGroup}
        onClose={() => setShowJoinGroup(false)}
        onSuccess={loadData}
      />

      <ShareGroupModal
        isOpen={showShareGroup}
        onClose={() => {
          setShowShareGroup(false)
          setSelectedGroup(null)
        }}
        group={selectedGroup}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSuccess={loadData}
      />

      <AddWishModal
        isOpen={showAddWish}
        onClose={() => setShowAddWish(false)}
        onSuccess={loadData}
      />

      {/* Bottom Navigation - Mobile App Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden safe-area-pb">
        <div className="flex items-center justify-around py-3 px-4">
          {/* Home */}
          <button
            onClick={() => setBottomNavActive('home')}
            className={`flex flex-col items-center gap-1 py-3 px-4 rounded-lg transition-colors min-h-[60px] min-w-[60px] ${
              bottomNavActive === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <Home size={22} />
            <span className="text-xs font-medium">Hjem</span>
          </button>

          {/* Grupper */}
          <button
            onClick={() => setBottomNavActive('groups')}
            className={`flex flex-col items-center gap-1 py-3 px-4 rounded-lg transition-colors min-h-[60px] min-w-[60px] ${
              bottomNavActive === 'groups' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <Users size={22} />
            <span className="text-xs font-medium">Grupper</span>
          </button>

          {/* Central + Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAddWish(true)}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg min-h-[64px] min-w-[64px]"
          >
            <Plus size={28} />
          </motion.button>

          {/* Ønsker */}
          <button
            onClick={() => setBottomNavActive('wishes')}
            className={`flex flex-col items-center gap-1 py-3 px-4 rounded-lg transition-colors min-h-[60px] min-w-[60px] ${
              bottomNavActive === 'wishes' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <Gift size={22} />
            <span className="text-xs font-medium">Ønsker</span>
          </button>

          {/* Premium */}
          <button
            onClick={() => setBottomNavActive('premium')}
            className={`flex flex-col items-center gap-1 py-3 px-4 rounded-lg transition-colors min-h-[60px] min-w-[60px] ${
              bottomNavActive === 'premium' ? 'text-purple-600 bg-purple-50' : 'text-gray-500'
            }`}
          >
            <Crown size={22} />
            <span className="text-xs font-medium">Premium</span>
          </button>
        </div>
      </div>

      {/* Modaler */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSuccess={loadData}
      />

      <JoinGroupModal
        isOpen={showJoinGroup}
        onClose={() => setShowJoinGroup(false)}
        onSuccess={loadData}
      />

      <ShareGroupModal
        isOpen={showShareGroup}
        onClose={() => setShowShareGroup(false)}
        group={selectedGroup}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSuccess={loadData}
      />

      <AddWishModal
        isOpen={showAddWish}
        onClose={() => setShowAddWish(false)}
        onSuccess={loadData}
      />

      <SecretSantaModal
        isOpen={showSecretSantaModal}
        onClose={() => setShowSecretSantaModal(false)}
        groupId={selectedGroupForSecretSanta || ''}
        onSuccess={loadData}
      />

      <MysteryGiftModal
        isOpen={showMysteryGiftModal}
        onClose={() => setShowMysteryGiftModal(false)}
        groupId={selectedGroupForMysteryGift || ''}
        isAdmin={true}
        mysteryGiftEnabled={false}
        mysteryGiftBudget={200}
        onSuccess={loadData}
      />

      {/* Add bottom padding for mobile to account for bottom nav */}
      <div className="h-20 md:hidden" />
    </div>
  )
}
