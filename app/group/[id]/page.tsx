'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Gift, Settings, UserPlus, Crown, Shuffle, Eye, EyeOff, Share2, Home, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import { Group, WishlistItem, GroupMember } from '@/types'
import GroupCard from '@/components/GroupCard'
import WishlistCard from '@/components/WishlistCard'
import AddWishModal from '@/components/AddWishModal'
import InviteModal from '@/components/InviteModal'
import ShareGroupModal from '@/components/ShareGroupModal'
import toast from 'react-hot-toast'

export default function GroupDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [wishlists, setWishlists] = useState<WishlistItem[]>([])
  const [secretSantaTarget, setSecretSantaTarget] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddWish, setShowAddWish] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showShareGroup, setShowShareGroup] = useState(false)
  const [showSecretSanta, setShowSecretSanta] = useState(false)

  const groupId = params.id as string
  const isAdmin = user?.id === group?.admin_id

  useEffect(() => {
    if (groupId) {
      loadGroupData()
    }
  }, [groupId])

  const loadGroupData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Last gruppedetaljer
      const { data: groupData, error: groupError } = await database.getGroupDetails(groupId)
      if (groupError) {
        toast.error('Kunne ikke laste gruppe')
        router.push('/dashboard')
        return
      }
      setGroup(groupData)

      // Last medlemmer
      const { data: membersData, error: membersError } = await database.getGroupMembers(groupId)
      if (membersError) {
        console.error('Feil ved lasting av medlemmer:', membersError)
      } else {
        setMembers(membersData || [])
      }

      // Last ønskelister
      const { data: wishlistsData, error: wishlistsError } = await database.getGroupWishlists(groupId)
      if (wishlistsError) {
        console.error('Feil ved lasting av ønskelister:', wishlistsError)
      } else {
        setWishlists(wishlistsData || [])
      }

      // Secret Santa er deaktivert for nå
      // TODO: Aktiver når Secret Santa funksjonalitet er ferdig implementert

    } catch (error) {
      console.error('Feil ved lasting av gruppedata:', error)
      toast.error('Kunne ikke laste gruppedata')
    }
    setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-white via-red-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-christmas-red"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-white via-red-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gruppe ikke funnet</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-christmas-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Tilbake til dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-white via-red-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-gray-400 hover:text-christmas-red transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-christmas-green">{group.name}</h1>
                <p className="text-gray-600">{members.length} medlemmer</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowShareGroup(true)}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    <Share2 size={18} />
                    Del
                  </button>
                  <button
                    onClick={() => setShowInvite(true)}
                    className="flex items-center gap-2 bg-christmas-green text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
                  >
                    <UserPlus size={18} />
                    Inviter
                  </button>
                </>
              )}
              <button
                onClick={() => setShowAddWish(true)}
                className="flex items-center gap-2 bg-christmas-red text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                <Gift size={18} />
                Nytt ønske
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Secret Santa seksjon */}
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
              <p className="font-semibold">
                Du skal kjøpe gave til: <span className="text-2xl">{secretSantaTarget.receiver?.full_name || 'Ukjent'}</span>
              </p>
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
                onClick={() => setShowSecretSanta(!showSecretSanta)}
                className="flex items-center gap-3 p-4 bg-christmas-green/10 text-christmas-green rounded-lg hover:bg-christmas-green/20 transition-colors"
              >
                {showSecretSanta ? <EyeOff size={24} /> : <Eye size={24} />}
                <div className="text-left">
                  <div className="font-semibold">
                    {showSecretSanta ? 'Skjul' : 'Vis'} Secret Santa
                  </div>
                  <div className="text-sm text-gray-600">Administrer trekning</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Medlemmer */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={24} />
            Medlemmer ({members.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt={member.profile.full_name || member.profile.email}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-bold text-sm">
                        {member.profile?.full_name?.[0] || member.profile?.email[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {member.profile?.full_name || member.profile?.email || 'Ukjent bruker'}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">{member.role}</div>
                    {member.profile?.email && member.profile?.full_name && (
                      <div className="text-xs text-gray-400">{member.profile.email}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ønskelister */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Gift size={24} />
            Ønskelister ({wishlists.length})
          </h2>
          
          {wishlists.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Gift className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ingen ønsker ennå
              </h3>
              <p className="text-gray-600 mb-4">
                Legg til ditt første ønske for å komme i gang
              </p>
              <button
                onClick={() => setShowAddWish(true)}
                className="bg-christmas-red text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Legg til ønske
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          )}
        </div>
      </div>

      {/* Modaler */}
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

      {/* Bottom Navigation - Mobile App Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden safe-area-pb">
        <div className="flex items-center justify-around py-3 px-4">
          {/* Home */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex flex-col items-center gap-1 py-3 px-4 rounded-lg transition-colors text-gray-500 min-h-[60px] min-w-[60px]"
          >
            <Home size={22} />
            <span className="text-xs font-medium">Hjem</span>
          </button>

          {/* Grupper */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex flex-col items-center gap-1 py-3 px-4 rounded-lg transition-colors text-blue-600 bg-blue-50 min-h-[60px] min-w-[60px]"
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
            onClick={() => router.push('/dashboard')}
            className="flex flex-col items-center gap-1 py-3 px-4 rounded-lg transition-colors text-gray-500 min-h-[60px] min-w-[60px]"
          >
            <Gift size={22} />
            <span className="text-xs font-medium">Ønsker</span>
          </button>

          {/* Premium */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex flex-col items-center gap-1 py-3 px-4 rounded-lg transition-colors text-gray-500 min-h-[60px] min-w-[60px]"
          >
            <Crown size={22} />
            <span className="text-xs font-medium">Premium</span>
          </button>
        </div>
      </div>

      {/* Add bottom padding for mobile to account for bottom nav */}
      <div className="h-20 md:hidden" />
    </div>
  )
}
