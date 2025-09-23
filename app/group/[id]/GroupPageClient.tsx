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

interface GroupPageClientProps {
  groupId: string
}

export default function GroupPageClient({ groupId }: GroupPageClientProps) {
  const router = useRouter()
  const { user, isPremium, loading: authLoading } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [wishlists, setWishlists] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddWish, setShowAddWish] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showPriceOverview, setShowPriceOverview] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingPrices, setUpdatingPrices] = useState(false)

  const loadGroupData = useCallback(async () => {
    if (!groupId) return

    setLoading(true)
    try {
      // Hent gruppedetaljer
      const { data: groupData, error: groupError } = await database.getGroupDetails(groupId)
      if (groupError || !groupData) {
        toast.error('Kunne ikke laste gruppe')
        router.push('/groups')
        return
      }

      setGroup(groupData)
      setIsAdmin(groupData.admin_id === user?.id)

      // Hent medlemmer
      const { data: membersData, error: membersError } = await database.getGroupMembers(groupId)
      if (membersError) {
        console.error('Error loading members:', membersError)
      } else {
        setMembers(membersData || [])
      }

      // Hent ønskelister
      const { data: wishlistsData, error: wishlistsError } = await database.getGroupWishlists(groupId)
      if (wishlistsError) {
        console.error('Error loading wishlists:', wishlistsError)
      } else {
        setWishlists(wishlistsData || [])
      }
    } catch (error) {
      console.error('Error loading group data:', error)
      toast.error('Noe gikk galt ved lasting av gruppe')
    }
    setLoading(false)
  }, [groupId, user?.id, router])

  useEffect(() => {
    if (groupId && !authLoading) {
      loadGroupData()
    }
  }, [groupId, authLoading, loadGroupData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadGroupData()
    setRefreshing(false)
  }

  const handleAddWish = async (wishData: any) => {
    if (!user || !groupId) return

    const { data, error } = await database.addWishlistItem({
      ...wishData,
      user_id: user.id,
      group_id: groupId
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Ønske lagt til! 🎁')
      setShowAddWish(false)
      loadGroupData()
    }
  }

  const handleInvite = async (email: string) => {
    if (!user || !groupId) return

    const { data, error } = await database.inviteUserToGroup(groupId, email, user.id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Invitasjon sendt! 📧')
      setShowInvite(false)
    }
  }

  const handleUpdatePrices = async () => {
    setUpdatingPrices(true)
    try {
      const response = await fetch('/api/update-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Priser oppdatert! ${data.results.updated} produkter oppdatert, ${data.results.priceDrops} prisfall funnet`)
        loadGroupData() // Reload group data to show updated prices
      } else {
        toast.error(data.error || 'Kunne ikke oppdatere priser')
      }
    } catch (error) {
      console.error('Error updating prices:', error)
      toast.error('Kunne ikke oppdatere priser')
    } finally {
      setUpdatingPrices(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster gruppe...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gruppe ikke funnet</h1>
          <button
            onClick={() => router.push('/groups')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Tilbake til grupper
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
              <p className="text-gray-600">{members.length} medlemmer</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={20} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowInvite(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <UserPlus size={20} className="text-gray-600" />
                </button>
              )}
              <button
                onClick={() => setShowShare(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Gruppekort */}
        <GroupCard group={group} members={members} />

        {/* Premium-funksjoner */}
        {isPremium && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-purple-900">Premium-funksjoner</h3>
                <p className="text-sm text-purple-700">Tilgjengelig for deg</p>
              </div>
              <button
                onClick={() => setShowPriceOverview(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                Se prisoversikt
              </button>
            </div>
          </div>
        )}

        {/* Ønskelister */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ønskelister</h2>
            <div className="flex gap-2">
              <button
                onClick={handleUpdatePrices}
                disabled={updatingPrices}
                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={16} className={updatingPrices ? 'animate-spin' : ''} />
                {updatingPrices ? 'Oppdaterer...' : 'Oppdater priser'}
              </button>
              <button
                onClick={() => setShowAddWish(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Legg til ønske
              </button>
            </div>
          </div>

          {wishlists.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Gift className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen ønsker ennå</h3>
              <p className="text-gray-600 mb-4">Legg til det første ønsket i gruppen</p>
              <button
                onClick={() => setShowAddWish(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Legg til ønske
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {wishlists.map((wishlist) => (
                <WishlistCard
                  key={wishlist.id}
                  item={wishlist}
                  onUpdate={loadGroupData}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modaler */}
      {showAddWish && (
        <AddWishModal
          isOpen={showAddWish}
          onClose={() => setShowAddWish(false)}
          onAdd={handleAddWish}
        />
      )}

      {showInvite && (
        <InviteModal
          isOpen={showInvite}
          onClose={() => setShowInvite(false)}
          onInvite={handleInvite}
        />
      )}

      {showShare && (
        <ShareGroupModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          group={group}
        />
      )}

      {showPriceOverview && (
        <GroupPriceOverview
          isOpen={showPriceOverview}
          onClose={() => setShowPriceOverview(false)}
          groupId={groupId}
        />
      )}
    </div>
  )
}
