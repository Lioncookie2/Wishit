'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, Gift, ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react'
import { database } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface JoinPageClientProps {
  code: string
}

export default function JoinPageClient({ code }: JoinPageClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [group, setGroup] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (code) {
      loadGroupInfo()
    }
  }, [code])

  const loadGroupInfo = async () => {
    setLoading(true)
    try {
      // Finn gruppe med kode (uten autentisering)
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id, name, description, join_code, created_at')
        .eq('join_code', code)
        .single()

      if (groupError) {
        console.error('Error loading group:', groupError)
        if (groupError.code === 'PGRST116') {
          setError('Gruppe ikke funnet')
        } else if (groupError.code === 'PGRST301') {
          setError('Ugyldig gruppe-kode')
        } else {
          setError('Kunne ikke laste gruppe-informasjon')
        }
        return
      }

      if (!groupData) {
        setError('Ugyldig gruppe-kode')
        return
      }

      setGroup(groupData)
    } catch (error) {
      console.error('Error loading group:', error)
      setError('Kunne ikke laste gruppe-informasjon')
    }
    setLoading(false)
  }

  const handleJoinGroup = async () => {
    setJoining(true)
    try {
      // Sjekk om bruker er logget inn
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        // Redirect til login med return URL
        const returnUrl = encodeURIComponent(window.location.href)
        router.push(`/?returnUrl=${returnUrl}`)
        return
      }

      // Bli med i gruppen
      const { data, error } = await database.joinGroupWithCode(code, user.id)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success(`Du er nå medlem av gruppen! 🎉`)
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Noe gikk galt ved å bli med i gruppen')
    }
    setJoining(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Laster gruppe-informasjon...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-xl">
          <XCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ugyldig kode</h1>
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
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bli med i gruppe</h1>
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
                <Gift className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bli med i {group?.name}
              </h2>
              <p className="text-gray-600">
                Du har blitt invitert til å bli medlem av denne gruppen
              </p>
            </div>

            {/* Gruppekode */}
            <div className="bg-gray-50 rounded-xl p-6 text-center mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Gruppekode</h3>
              <div className="text-3xl font-mono font-bold text-gray-900 tracking-widest mb-2">
                {code}
              </div>
              <p className="text-sm text-gray-500">
                Firesifret kode for å bli med i gruppen
              </p>
            </div>

            {/* Gruppinfo */}
            {group && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-blue-500" size={20} />
                  <span className="font-medium text-blue-900">{group.name}</span>
                </div>
                {group.description && (
                  <p className="text-sm text-blue-700">{group.description}</p>
                )}
              </div>
            )}

            {/* Handlingsknapper */}
            <div className="space-y-3">
              <button
                onClick={handleJoinGroup}
                disabled={joining}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {joining ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Blir med...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Bli med i gruppe
                  </>
                )}
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Avbryt
              </button>
            </div>

            {/* Instruksjoner */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
              <h4 className="font-medium text-yellow-900 mb-2">Slik fungerer det:</h4>
              <ol className="text-sm text-yellow-800 space-y-1">
                <li>1. Trykk "Bli med i gruppe" for å logge inn</li>
                <li>2. Du blir automatisk medlem av gruppen</li>
                <li>3. Du kan nå se og legge til ønsker i gruppen</li>
              </ol>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
