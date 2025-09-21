'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Users, Crown, Search, Filter } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import { Group } from '@/types'
import GroupCard from '@/components/GroupCard'
import CreateGroupModal from '@/components/CreateGroupModal'
import JoinGroupModal from '@/components/JoinGroupModal'
import SecretSantaModal from '@/components/SecretSantaModal'
import MysteryGiftModal from '@/components/MysteryGiftModal'
import ShareGroupModal from '@/components/ShareGroupModal'
import toast from 'react-hot-toast'

export default function GroupsPage() {
  const router = useRouter()
  const { user, isPremium, loading: authLoading } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [showSecretSantaModal, setShowSecretSantaModal] = useState(false)
  const [showMysteryGiftModal, setShowMysteryGiftModal] = useState(false)
  const [selectedGroupForSecretSanta, setSelectedGroupForSecretSanta] = useState<string | null>(null)
  const [selectedGroupForMysteryGift, setSelectedGroupForMysteryGift] = useState<string | null>(null)
  const [showShareGroup, setShowShareGroup] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'member'>('all')

  useEffect(() => {
    if (user && !authLoading) {
      console.log('🔄 Groups useEffect triggered with user:', { userId: user.id })
      loadGroups()
    } else {
      console.log('⏳ Groups useEffect waiting for user or auth to finish:', { user: user?.id, authLoading })
    }
  }, [user, authLoading])

  const loadGroups = async () => {
    console.log('🔍 loadGroups called')
    try {
      setLoading(true)
      console.log('⏳ Loading groups...')
      const { data, error } = await database.getUserGroups()
      console.log('🔍 Groups result:', { data, error })
      
      if (error) {
        console.error('❌ Error loading groups:', error)
        setGroups([])
        if (error.message?.includes('permission denied')) {
          console.error('❌ Permission denied error')
          toast.error('Tillatelsesproblem - sjekk RLS-innstillinger')
        } else {
          console.error('❌ Other error:', error.message)
          toast.error('Kunne ikke laste grupper')
        }
      } else {
        console.log('✅ Groups loaded successfully:', data)
        setGroups(data || [])
      }
    } catch (error) {
      console.error('❌ Error loading groups:', error)
      setGroups([])
      toast.error('Noe gikk galt ved lasting av grupper')
    } finally {
      console.log('🏁 Finished loading groups, setting loading to false')
      setLoading(false)
    }
  }

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterType === 'admin') return matchesSearch && group.admin_id === user?.id
    if (filterType === 'member') return matchesSearch && group.admin_id !== user?.id
    return matchesSearch
  })

  const adminGroups = groups.filter(group => group.admin_id === user?.id)
  const memberGroups = groups.filter(group => group.admin_id !== user?.id)

  const handleSecretSantaClick = (groupId: string) => {
    setSelectedGroupForSecretSanta(groupId)
    setShowSecretSantaModal(true)
  }

  const handleMysteryGiftClick = (groupId: string) => {
    setSelectedGroupForMysteryGift(groupId)
    setShowMysteryGiftModal(true)
  }

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Logg inn for å se grupper</h1>
          <p className="text-gray-600">Du må være logget inn for å se dine grupper</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Grupper</h1>
              <p className="text-gray-600">
                {groups.length} grupper • {adminGroups.length} admin • {memberGroups.length} medlem
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowJoinGroup(true)}
                className="bg-gray-500 text-white p-3 rounded-xl hover:bg-gray-600 transition-colors"
              >
                <Users size={20} />
              </button>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Søk i grupper..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilterType('admin')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'admin' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Crown className="inline mr-1" size={14} />
                Admin
              </button>
              <button
                onClick={() => setFilterType('member')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'member' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Users className="inline mr-1" size={14} />
                Medlem
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-gray-400" size={48} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Ingen grupper funnet' : 'Ingen grupper ennå'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Prøv å endre søkeordene dine'
                : 'Opprett din første gruppe eller bli med i en eksisterende'
              }
            </p>
            {!searchTerm && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Opprett gruppe
                </button>
                <button
                  onClick={() => setShowJoinGroup(true)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Bli med i gruppe
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GroupCard
                  group={group}
                  memberCount={group.members?.length || 0}
                  wishlistCount={group.wishlistCount || 0}
                  onClick={() => {
                    router.push(`/group/${group.id}`)
                  }}
                  onShare={(groupToShare) => {
                    setSelectedGroup(groupToShare)
                    setShowShareGroup(true)
                  }}
                  onAddWish={(groupId) => {
                    // Navigate to group and open add wish
                    window.location.href = `/group/${groupId}?addWish=true`
                  }}
                  onSecretSanta={handleSecretSantaClick}
                  onMysteryGift={handleMysteryGiftClick}
                  isPremium={isPremium}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSuccess={loadGroups}
      />

      <JoinGroupModal
        isOpen={showJoinGroup}
        onClose={() => setShowJoinGroup(false)}
        onSuccess={loadGroups}
      />

      <SecretSantaModal
        isOpen={showSecretSantaModal}
        onClose={() => setShowSecretSantaModal(false)}
        groupId={selectedGroupForSecretSanta || ''}
        onSuccess={loadGroups}
      />

      <MysteryGiftModal
        isOpen={showMysteryGiftModal}
        onClose={() => setShowMysteryGiftModal(false)}
        groupId={selectedGroupForMysteryGift || ''}
        isAdmin={true}
        mysteryGiftEnabled={false}
        mysteryGiftBudget={200}
        onSuccess={loadGroups}
      />
      
      <ShareGroupModal
        isOpen={showShareGroup}
        onClose={() => setShowShareGroup(false)}
        group={selectedGroup}
      />
    </div>
  )
}
