'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Copy, Share2, Users, Send } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import toast from 'react-hot-toast'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  group: {
    id: string
    name: string
    admin_id: string
  }
  onSuccess?: () => void
}

export default function InviteModal({ isOpen, onClose, group, onSuccess }: InviteModalProps) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteData, setInviteData] = useState<any>(null)

  const handleEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !user) return

    setLoading(true)
    try {
      const { data, error } = await database.inviteToGroup(group.id, email.trim(), user.id)
      if (error) {
        toast.error('Kunne ikke sende invitasjon')
      } else {
        toast.success(`Invitasjon sendt til ${email}!`)
        setEmail('')
        onSuccess?.()
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleGenerateLink = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await database.inviteToGroup(group.id, 'invite-link', user.id)
      if (error) {
        toast.error('Kunne ikke generere invitasjonslenke')
      } else {
        setInviteData(data)
        setInviteLink((data as any)?.invite_url || '')
        toast.success('Invitasjonslenke generert!')
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast.success('Lenke kopiert!')
    } catch (error) {
      toast.error('Kunne ikke kopiere lenke')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bli med i ${group.name}`,
          text: `Du er invitert til å bli med i gruppen "${group.name}" på Julegaveapp! Klikk på lenken for å bli med.`,
          url: inviteLink,
        })
      } catch (error) {
        // Bruker avbrøt deling
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-christmas-green">
                Inviter til {group.name}
              </h2>
              <p className="text-gray-600 mt-2">
                Inviter familie og venner til å bli med i gruppen
              </p>
            </div>

            <div className="space-y-6">
              {/* E-post invitasjon */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mail size={18} />
                  Send e-post invitasjon
                </h3>
                <form onSubmit={handleEmailInvite} className="space-y-3">
                  <input
                    type="email"
                    placeholder="E-postadresse"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full bg-christmas-red text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Sender...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send invitasjon
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Delingslenke */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Share2 size={18} />
                  Delingslenke
                </h3>
                
                {!inviteLink ? (
                  <button
                    onClick={handleGenerateLink}
                    disabled={loading}
                    className="w-full bg-christmas-green text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Genererer...
                      </>
                    ) : (
                      <>
                        <Users size={18} />
                        Generer delingslenke
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <p className="text-sm text-gray-600 break-all">{inviteLink}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyLink}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy size={16} />
                        Kopier
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex-1 bg-christmas-green text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Share2 size={16} />
                        Del
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Tips:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• E-post invitasjoner sendes direkte til mottakeren</li>
                  <li>• Delingslenke kan deles via melding eller sosiale medier</li>
                  <li>• Mottakeren trenger ikke å ha appen installert først</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
