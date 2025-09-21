'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Gift, Settings, UserPlus, Crown, Shuffle, Eye, EyeOff, Share2, Home, Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import { Group, WishlistItem, GroupMember } from '@/types'
import GroupCard from '@/components/GroupCard'
import WishlistCard from '@/components/WishlistCard'
import AddWishModal from '@/components/AddWishModal'
import InviteModal from '@/components/InviteModal'
import ShareGroupModal from '@/components/ShareGroupModal'
import GroupPriceOverview from '@/components/GroupPriceOverview'
import toast from 'react-hot-toast'
import he from 'he'

export default function GroupDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isPremium, loading: authLoading } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [wishlists, setWishlists] = useState<WishlistItem[]>([])
  const [secretSantaTarget, setSecretSantaTarget] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddWish, setShowAddWish] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showShareGroup, setShowShareGroup] = useState(false)
  const [showSecretSanta, setShowSecretSanta] = useState(false)
  const [showSecretSantaModal, setShowSecretSantaModal] = useState(false)
  const [updatingPrices, setUpdatingPrices] = useState(false)

  const groupId = params.id as string
  const isAdmin = user?.id === group?.admin_id

  // Define loadGroupData function before useEffect
  const loadGroupData = useCallback(async () => {
    console.log('🔍 loadGroupData called with:', { groupId, user: user?.id })
    
    if (!user) {
      console.log('❌ No user found, returning early')
      return
    }

    setLoading(true)
    console.log('⏳ Starting to load group data...')
    
    try {
      // Last gruppedetaljer
      console.log('📋 Loading group details...')
      const { data: groupData, error: groupError } = await database.getGroupDetails(groupId)
      console.log('📋 Group details result:', { groupData, groupError })
      
      if (groupError) {
        console.error('❌ Group details error:', groupError)
        toast.error('Kunne ikke laste gruppe')
        router.push('/groups')
        return
      }
      
      console.log('✅ Group details loaded successfully:', groupData)
      setGroup(groupData)

      // Last medlemmer
      console.log('👥 Loading group members...')
      const { data: membersData, error: membersError } = await database.getGroupMembers(groupId)
      console.log('👥 Members result:', { membersData, membersError })
      
      if (membersError) {
        console.error('❌ Feil ved lasting av medlemmer:', membersError)
      } else {
        console.log('✅ Members loaded successfully:', membersData)
        setMembers(membersData || [])
      }

      // Last ønskelister
      console.log('🎁 Loading wishlists...')
      const { data: wishlistsData, error: wishlistsError } = await database.getGroupWishlists(groupId)
      console.log('🎁 Wishlists result:', { wishlistsData, wishlistsError })
      
      if (wishlistsError) {
        console.error('❌ Feil ved lasting av ønskelister:', wishlistsError)
      } else {
        console.log('✅ Wishlists loaded successfully:', wishlistsData)
        setWishlists(wishlistsData || [])
      }

      // Last Secret Santa target
      if (user) {
        const { data: secretSantaData } = await database.getSecretSantaTarget(groupId, user.id)
        setSecretSantaTarget(secretSantaData)
      }

    } catch (error) {
      console.error('❌ Feil ved lasting av gruppedata:', error)
      toast.error('Kunne ikke laste gruppedata')
      // Ikke krasj appen, bare vis feil
    } finally {
      console.log('🏁 Finished loading group data, setting loading to false')
      setLoading(false)
    }
  }, [groupId, user, router])

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (groupId && user) {
      console.log('🔄 useEffect triggered with groupId and user:', { groupId, userId: user.id })
      loadGroupData()
    } else {
      console.log('⏳ useEffect waiting for user or groupId:', { groupId, user: user?.id })
    }
  }, [groupId, user, loadGroupData])

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Show error if no user after auth loading
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ikke logget inn</h1>
          <p className="text-gray-600 mb-4">Du må være logget inn for å se gruppen</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Gå til hjemmesiden
          </button>
        </div>
      </div>
    )
  }

  // Error boundary fallback
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const handleCreateSecretSanta = async () => {
    if (!isAdmin) return

    setLoading(true)
    try {
      const { error } = await database.createSecretSantaDraw(groupId)
      if (error) {
        toast.error(error.message || 'Kunne ikke opprette Secret Santa')
      } else {
        toast.success('Secret Santa trekning opprettet! 🎅')
        loadGroupData()
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleSecretSantaClick = () => {
    setShowSecretSantaModal(true)
  }

  const handleUpdatePrices = async () => {
    setUpdatingPrices(true)
    try {
      const response = await fetch('/api/update-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Priser oppdatert! ${data.results.updated} oppdatert, ${data.results.priceDrops} prisfall funnet`)
        loadGroupData() // Reload data to show updated prices
      } else {
        toast.error(data.error || 'Kunne ikke oppdatere priser')
      }
    } catch (error) {
      toast.error('Feil ved oppdatering av priser')
    } finally {
      setUpdatingPrices(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-white via-red-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/groups')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {he.decode(group?.name || 'Gruppe')}
                </h1>
                <p className="text-sm text-gray-600">
                  {members.length} medlemmer • {wishlists.length} ønsker
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdatePrices}
                disabled={updatingPrices}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Oppdater priser"
              >
                <RefreshCw size={20} className={updatingPrices ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        {/* Group Price Overview */}
        <div className="mb-8">
          <GroupPriceOverview 
            groupId={groupId} 
            isPremium={isPremium} 
          />
        </div>

        {/* Secret Santa Display */}
        {secretSantaTarget && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-christmas-gold to-yellow-500 text-white rounded-xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🎅</div>
              <div>
                <h2 className="text-xl font-bold">Secret Santa</h2>
                <p className="text-white/90">Din hemmelige gaveperson</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <p className="font-semibold mb-2">
                Du skal kjøpe gave til: <span className="text-2xl">{secretSantaTarget.receiver?.full_name || 'Ukjent'}</span>
              </p>
              {secretSantaTarget.budget && (
                <p className="text-sm text-white/90">
                  Budsjett: {new Intl.NumberFormat('no-NO', {
                    style: 'currency',
                    currency: 'NOK',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(secretSantaTarget.budget)}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Admin-kontroller */}
        {isAdmin && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Crown className="text-christmas-gold" size={20} />
              Administrator-kontroller
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={handleCreateSecretSanta}
                disabled={loading || members.length < 3}
                className="flex items-center gap-3 p-4 bg-christmas-red/10 text-christmas-red rounded-lg hover:bg-christmas-red/20 transition-colors disabled:opacity-50"
              >
                <Shuffle size={24} />
                <div className="text-left">
                  <div className="font-semibold">Opprett Secret Santa</div>
                  <div className="text-sm text-gray-600">
                    {members.length < 3 ? 'Trenger minst 3 medlemmer' : 'Trekke gavepersoner'}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-3 p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <UserPlus size={24} />
                <div className="text-left">
                  <div className="font-semibold">Inviter medlemmer</div>
                  <div className="text-sm text-gray-600">Send invitasjon</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Medlemmer */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="text-blue-500" size={20} />
            Medlemmer ({members.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {he.decode(member.profile?.full_name || member.profile?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {he.decode(member.profile?.full_name || member.profile?.email || 'Ukjent bruker')}
                  </p>
                  {member.user_id === group?.admin_id && (
                    <p className="text-xs text-gray-500">Admin</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ønskelister */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Gift className="text-green-500" size={20} />
              Ønskelister ({wishlists.length})
            </h3>
            <button
              onClick={() => setShowAddWish(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus size={16} />
              Legg til ønske
            </button>
          </div>

          {wishlists.length > 0 ? (
            <div className="grid gap-6">
              {wishlists.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  showPurchaseOption={true}
                  onUpdate={loadGroupData}
                  onDelete={loadGroupData}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen ønsker ennå</h3>
              <p className="text-gray-500 mb-4">Bli den første til å legge til et ønske!</p>
              <button
                onClick={() => setShowAddWish(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={16} />
                Legg til første ønske
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddWishModal
        isOpen={showAddWish}
        onClose={() => setShowAddWish(false)}
        groupId={groupId}
        onSuccess={loadGroupData}
      />

      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        group={group}
        onSuccess={loadGroupData}
      />

      <ShareGroupModal
        isOpen={showShareGroup}
        onClose={() => setShowShareGroup(false)}
        group={group}
      />
    </div>
  )
}