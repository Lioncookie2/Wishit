'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Trash2, AlertTriangle, Shield, User, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AccountSettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleDeleteAccount = async () => {
    if (confirmText !== 'SLETT KONTO') {
      toast.error('Du må skrive "SLETT KONTO" for å bekrefte')
      return
    }

    setDeleteLoading(true)
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Kunne ikke slette konto')
      }

      toast.success('Kontoen din er slettet. Takk for at du brukte Wishit!')
      
      // Logg ut og redirect til forsiden
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error(error instanceof Error ? error.message : 'Noe gikk galt ved sletting av konto')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Logg inn for å se kontoinnstillinger</h1>
          <p className="text-gray-600">Du må være logget inn for å administrere kontoen din</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kontoinnstillinger</h1>
              <p className="text-gray-600">Administrer din konto og personvern</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Kontoinformasjon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} />
            Kontoinformasjon
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">E-post</p>
                <p className="text-gray-900">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User size={16} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Navn</p>
                <p className="text-gray-900">{user.user_metadata?.full_name || 'Ikke oppgitt'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Konto opprettet</p>
                <p className="text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('no-NO')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personvern og sikkerhet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={20} />
            Personvern og sikkerhet
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Dine data</h3>
              <p className="text-sm text-blue-700">
                Vi lagrer kun nødvendig informasjon for å gi deg den beste opplevelsen. 
                Du kan når som helst be om å få dataene dine eksportert eller slettet.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Sikkerhet</h3>
              <p className="text-sm text-green-700">
                Alle data er kryptert og lagret sikkert. Vi bruker bransjestandard sikkerhetstiltak 
                for å beskytte din informasjon.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Farlig sone - Konto-sletting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Farlig sone
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
              <h3 className="font-medium text-red-900 mb-2">Slett konto permanent</h3>
              <p className="text-sm text-red-700 mb-4">
                Dette vil permanent slette kontoen din og alle tilhørende data. 
                Denne handlingen kan ikke angres.
              </p>
            
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Slett konto
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-200 border border-red-400 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">⚠️ Bekreft sletting</h4>
                    <p className="text-sm text-red-800 mb-3">
                      For å bekrefte at du vil slette kontoen din permanent, 
                      skriv <strong>"SLETT KONTO"</strong> i feltet nedenfor:
                    </p>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Skriv 'SLETT KONTO' her"
                      className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-red-900 placeholder-red-500"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading || confirmText !== 'SLETT KONTO'}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {deleteLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sletter...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Bekreft sletting
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setConfirmText('')
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
