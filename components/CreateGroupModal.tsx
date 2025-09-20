'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, DollarSign, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'
import toast from 'react-hot-toast'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: '',
    budgetPerMember: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.name.trim()) return

    setLoading(true)
    try {
      const group = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        admin_id: user.id,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        budget_per_member: formData.budgetPerMember ? parseFloat(formData.budgetPerMember) : undefined,
      }

      const { error } = await database.createGroup(group)

      if (error) {
        toast.error('Kunne ikke opprette gruppe')
      } else {
        toast.success('Gruppe opprettet! 🎉')
        onSuccess?.()
        handleClose()
      }
    } catch (error) {
      toast.error('Noe gikk galt')
    }
    setLoading(false)
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      budget: '',
      budgetPerMember: '',
    })
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h2 className="text-2xl font-bold text-christmas-green">
                Opprett ny gruppe
              </h2>
              <p className="text-gray-600 mt-2">
                Samle familie og venner for å dele ønskelister
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="name"
                  placeholder="Gruppenavn (f.eks. Familie Hansen)"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                  required
                />
              </div>

              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                <textarea
                  name="description"
                  placeholder="Beskrivelse (valgfritt)"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign size={18} />
                  Budsjett (valgfritt)
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Totalt gruppebudsjett (kr)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    placeholder="10000"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                    min="0"
                    step="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budsjett per medlem (kr)
                  </label>
                  <input
                    type="number"
                    name="budgetPerMember"
                    placeholder="1000"
                    value={formData.budgetPerMember}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                    min="0"
                    step="50"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Tips:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Du blir automatisk administrator for gruppen</li>
                  <li>• Du kan invitere medlemmer etter opprettelse</li>
                  <li>• Budsjett hjelper med å planlegge gavegivning</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="w-full bg-gradient-to-r from-christmas-green to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Oppretter gruppe...
                  </div>
                ) : (
                  'Opprett gruppe'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
