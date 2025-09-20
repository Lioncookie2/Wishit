'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Users, Gift, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import toast from 'react-hot-toast'

interface InvitePageProps {
  params: {
    code: string
  }
}

export default function InvitePage({ params }: InvitePageProps) {
  const { user, signIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInvitation()
  }, [params.code])

  const loadInvitation = async () => {
    try {
      // Dekode invitasjonskoden
      const decoded = atob(params.code)
      const [groupId, timestamp] = decoded.split('-')
      
      if (!groupId) {
        setError('Ugyldig invitasjonslenke')
        setLoading(false)
        return
      }

      // Hent gruppeinformasjon
      const { data: group, error: groupError } = await database.getGroupDetails(groupId)
      
      if (groupError || !group) {
        setError('Gruppen ble ikke funnet')
        setLoading(false)
        return
      }

      setInvitation({
        group,
        inviter: 'En venn'
      })
      setLoading(false)
    } catch (error) {
      setError('Ugyldig invitasjonslenke')
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!user) {
      // Redirect til login med invitasjonskode
      router.push(`/login?invite=${params.code}`)
      return
    }

    if (!invitation) return

    setLoading(true)
    try {
      // Legg til bruker i gruppen
      const { error } = await database.addUserToGroup(invitation.group.id, user.id)
      
      if (error) {
        toast.error('Kunne ikke bli med i gruppen')
      } else {
        toast.success(`Velkommen til ${invitation.group.name}! 🎉`)
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleSignUp = () => {
    router.push(`/signup?invite=${params.code}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-white via-red-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-christmas-red mx-auto mb-4"></div>
          <p className="text-gray-600">Laster invitasjon...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-white via-red-50 to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl"
        >
          <XCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ugyldig invitasjon</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-christmas-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Gå til forsiden
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-white via-red-50 to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎁</div>
          <h1 className="text-3xl font-bold text-christmas-green mb-2">
            Du er invitert!
          </h1>
          <p className="text-gray-600">
            <span className="font-semibold">{invitation.inviter}</span> har invitert deg til å bli med i gruppen
          </p>
        </div>

        {/* Gruppekort */}
        <div className="bg-gradient-to-r from-christmas-red to-red-600 text-white rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-white" size={24} />
            <h2 className="text-xl font-bold">{invitation.group.name}</h2>
          </div>
          
          {invitation.group.description && (
            <p className="text-white/90 mb-4">{invitation.group.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Gift size={16} />
              <span>Julegavegruppe</span>
            </div>
            {invitation.group.budget_per_member && (
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span>{invitation.group.budget_per_member} kr per person</span>
              </div>
            )}
          </div>
        </div>

        {/* Handlingsknapper */}
        <div className="space-y-3">
          {user ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAcceptInvitation}
              disabled={loading}
              className="w-full bg-christmas-green text-white py-4 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Bli med...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Bli med i gruppen
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAcceptInvitation}
                className="w-full bg-christmas-green text-white py-4 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Logg inn og bli med
                <ArrowRight size={20} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignUp}
                className="w-full bg-christmas-red text-white py-4 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Opprett konto og bli med
                <ArrowRight size={20} />
              </motion.button>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Ved å bli med godtar du å dele ønskelister med gruppen
          </p>
        </div>
      </motion.div>
    </div>
  )
}
