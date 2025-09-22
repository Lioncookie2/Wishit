'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Users, Gift, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import toast from 'react-hot-toast'

interface InvitePageClientProps {
  code: string
}

export default function InvitePageClient({ code }: InvitePageClientProps) {
  const { user, signIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (code) {
      loadInvitation()
    }
  }, [code])

  const loadInvitation = async () => {
    setLoading(true)
    try {
      const { data, error } = await database.getInvitationByCode(code)

      if (error) {
        console.error('Error loading invitation:', error)
        if (error.message.includes('not found')) {
          setError('Invitasjon ikke funnet')
        } else if (error.message.includes('expired')) {
          setError('Invitasjonen har utløpt')
        } else {
          setError('Kunne ikke laste invitasjon')
        }
        return
      }

      if (!data) {
        setError('Invitasjon ikke funnet')
        return
      }

      setInvitation(data)
    } catch (error) {
      console.error('Error loading invitation:', error)
      setError('Kunne ikke laste invitasjon')
    }
    setLoading(false)
  }

  const handleAcceptInvitation = async () => {
    if (!user) {
      // Redirect til login med return URL
      const returnUrl = encodeURIComponent(window.location.href)
      router.push(`/?returnUrl=${returnUrl}`)
      return
    }

    setAccepting(true)
    try {
      const { data, error } = await database.acceptInvitation(code, user.id)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Du har akseptert invitasjonen! 🎉')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Noe gikk galt ved å akseptere invitasjonen')
    }
    setAccepting(false)
  }

  const handleRejectInvitation = async () => {
    if (!user) {
      router.push('/')
      return
    }

    try {
      const { error } = await database.rejectInvitation(code, user.id)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Du har avvist invitasjonen')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Noe gikk galt ved å avvise invitasjonen')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster invitasjon...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-xl">
          <XCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ugyldig invitasjon</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Tilbake til forsiden
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Gift className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gruppe-invitasjon</h1>
              <p className="text-gray-600">Du har blitt invitert til en gruppe</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200/50"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Invitasjon til {invitation?.group?.name}
              </h2>
              <p className="text-gray-600">
                {invitation?.group?.description || 'Du har blitt invitert til å bli medlem av denne gruppen'}
              </p>
            </div>

            {/* Invitasjonsinfo */}
            <div className="bg-gray-50 rounded-xl p-6 text-center mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Invitasjonskode</h3>
              <div className="text-3xl font-mono font-bold text-gray-900 tracking-widest mb-2">
                {code}
              </div>
              <p className="text-sm text-gray-500">
                Unik kode for denne invitasjonen
              </p>
            </div>

            {/* Gruppinfo */}
            {invitation?.group && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-blue-500" size={20} />
                  <span className="font-medium text-blue-900">{invitation.group.name}</span>
                </div>
                {invitation.group.description && (
                  <p className="text-sm text-blue-700">{invitation.group.description}</p>
                )}
                <div className="text-xs text-blue-600 mt-2">
                  Invitert av: {invitation.inviter?.full_name || invitation.inviter?.email || 'Ukjent'}
                </div>
              </div>
            )}

            {/* Handlingsknapper */}
            <div className="space-y-3">
              {user ? (
                <>
                  <button
                    onClick={handleAcceptInvitation}
                    disabled={accepting}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {accepting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Aksepterer...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Aksepter invitasjon
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleRejectInvitation}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    Avvis invitasjon
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    const returnUrl = encodeURIComponent(window.location.href)
                    router.push(`/?returnUrl=${returnUrl}`)
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowRight size={20} />
                  Logg inn for å akseptere
                </button>
              )}
            </div>

            {/* Instruksjoner */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
              <h4 className="font-medium text-yellow-900 mb-2">Slik fungerer det:</h4>
              <ol className="text-sm text-yellow-800 space-y-1">
                <li>1. Logg inn eller opprett en konto</li>
                <li>2. Aksepter invitasjonen for å bli medlem</li>
                <li>3. Du kan nå se og legge til ønsker i gruppen</li>
              </ol>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
