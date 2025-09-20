'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Share2, Users, CheckCircle } from 'lucide-react'
import { Group } from '@/types'
import toast from 'react-hot-toast'

interface ShareGroupModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group | null
}

export default function ShareGroupModal({ isOpen, onClose, group }: ShareGroupModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    if (!group?.join_code) {
      toast.error('Ingen gruppe-kode tilgjengelig')
      return
    }

    try {
      await navigator.clipboard.writeText(group.join_code)
      setCopied(true)
      toast.success('Kode kopiert! 📋')
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Kunne ikke kopiere kode')
    }
  }

  const handleShare = async () => {
    if (!group?.join_code) {
      toast.error('Ingen gruppe-kode tilgjengelig')
      return
    }

    const joinUrl = `${window.location.origin}/join/${group.join_code}`
    const shareData = {
      title: `Bli med i ${group.name}`,
      text: `Bli med i gruppen "${group.name}" med kode: ${group.join_code}`,
      url: joinUrl
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n\nLenke: ${joinUrl}`)
        toast.success('Gruppeinfo kopiert! 📋')
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Kunne ikke dele gruppe')
      }
    }
  }

  if (!group) return null

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
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Del gruppe
              </h2>
              <p className="text-gray-600">
                Gi denne koden til andre så de kan bli med i gruppen
              </p>
            </div>

            <div className="space-y-6">
              {/* Gruppekode */}
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Gruppekode</h3>
                <div className="text-4xl font-mono font-bold text-gray-900 tracking-widest mb-2">
                  {group.join_code || 'Laster...'}
                </div>
                <p className="text-sm text-gray-500">
                  Firesifret kode for å bli med i gruppen
                </p>
                {!group.join_code && (
                  <p className="text-xs text-red-500 mt-2">
                    Ingen kode funnet. Prøv å oppdatere siden.
                  </p>
                )}
              </div>

              {/* Gruppinfo */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-blue-500" size={20} />
                  <span className="font-medium text-blue-900">{group.name}</span>
                </div>
                {group.description && (
                  <p className="text-sm text-blue-700">{group.description}</p>
                )}
              </div>

              {/* Handlingsknapper */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="text-green-500" size={20} />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      Kopier kode
                    </>
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Del
                </button>
              </div>

              {/* Instruksjoner */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Slik fungerer det:</h4>
                <ol className="text-sm text-yellow-800 space-y-1">
                  <li>1. Gi koden til personen som skal bli med</li>
                  <li>2. De går til "Ny gruppe" → "Bli med i gruppe"</li>
                  <li>3. De skriver inn koden og blir medlem</li>
                </ol>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
