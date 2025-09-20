'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          toast.error(error.message || 'Feil ved innlogging')
        } else {
          toast.success('Velkommen tilbake!')
          onClose()
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passordene matcher ikke')
          setLoading(false)
          return
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName)
        if (error) {
          toast.error(error.message || 'Feil ved registrering')
        } else {
          toast.success('Konto opprettet! Sjekk e-posten din for bekreftelse.')
          onClose()
        }
      }
    } catch (error) {
      toast.error('Noe gikk galt. Prøv igjen.')
    }

    setLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error('Skriv inn e-postadressen din først')
      return
    }

    const { error } = await resetPassword(formData.email)
    if (error) {
      toast.error('Kunne ikke sende tilbakestilling av passord')
    } else {
      toast.success('Tilbakestillingslenke sendt til e-posten din!')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            className="bg-white rounded-2xl p-8 w-full max-w-md relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🎄</div>
              <h2 className="text-2xl font-bold text-christmas-green">
                {isLogin ? 'Velkommen tilbake!' : 'Bli med på julemagien'}
              </h2>
              <p className="text-gray-600 mt-2">
                {isLogin 
                  ? 'Logg inn for å fortsette juleplanleggingen' 
                  : 'Opprett en konto for å komme i gang'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Fullt navn"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="E-postadresse"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Passord"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {!isLogin && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Bekreft passord"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent"
                    required={!isLogin}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-christmas-red to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isLogin ? 'Logger inn...' : 'Oppretter konto...'}
                  </div>
                ) : (
                  isLogin ? 'Logg inn' : 'Opprett konto'
                )}
              </button>
            </form>

            {isLogin && (
              <button
                onClick={handleForgotPassword}
                className="w-full text-center text-christmas-red hover:text-red-600 mt-4 text-sm"
              >
                Glemt passord?
              </button>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isLogin ? 'Har du ikke en konto?' : 'Har du allerede en konto?'}
              </p>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-christmas-red hover:text-red-600 font-semibold"
              >
                {isLogin ? 'Opprett konto' : 'Logg inn'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
