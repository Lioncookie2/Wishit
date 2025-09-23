'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, Check, Star, Gift, DollarSign, Users, Sparkles, Lock, Zap, Apple } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { database } from '@/lib/database'
import toast from 'react-hot-toast'
import { Purchases } from '@revenuecat/purchases-capacitor'

export default function PremiumPage() {
  const { user, isPremium, updatePremiumStatus } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isNative, setIsNative] = useState(false)

  // Initialiser RevenueCat
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        // Sjekk om vi er i en native app (iOS/Android)
        const isNativeApp = typeof window !== 'undefined' && 
          (window.navigator.userAgent.includes('Capacitor') || 
           window.navigator.userAgent.includes('iOS') || 
           window.navigator.userAgent.includes('Android'))
        
        setIsNative(isNativeApp)
        
        if (isNativeApp) {
          // Initialiser RevenueCat for native app
          await Purchases.configure({
            apiKey: process.env.NEXT_PUBLIC_REVENUECAT_API_KEY || 'your_revenuecat_api_key'
          })
          
          // Hent produkter
          const offerings = await Purchases.getOfferings()
          if (offerings.current) {
            setProducts(offerings.current.availablePackages)
          }
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Error initializing RevenueCat:', error)
        setIsInitialized(true)
      }
    }

    initializeRevenueCat()
  }, [])

  const handlePurchase = async (packageToPurchase: any) => {
    if (!isNative || !user) {
      toast.error('In-app kjøp er kun tilgjengelig i mobilappen')
      return
    }

    setLoading(true)
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase)
      
      if (customerInfo.entitlements.active['premium']) {
        // Oppdater premium-status i Supabase
        await fetch('/api/premium/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await import('@/lib/supabase')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`
          },
          body: JSON.stringify({
            isPremium: true,
            transactionId: customerInfo.originalPurchaseDate
          })
        })
        
        updatePremiumStatus(true)
        toast.success('🎉 Gratulerer! Du er nå Premium-medlem!')
      }
    } catch (error: any) {
      if (error.code === 'PURCHASES_ERROR_PURCHASE_CANCELLED') {
        toast.error('Kjøpet ble avbrutt')
      } else {
        console.error('Purchase error:', error)
        toast.error('Noe gikk galt ved kjøp. Prøv igjen.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast.error('Vennligst skriv inn en kupongkode')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/premium/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPremium: true,
          couponCode: code.trim(),
          transactionId: `coupon_${Date.now()}`,
          userId: user?.id
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        updatePremiumStatus(true)
        toast.success('🎉 Gratulerer! Du er nå Premium-medlem!')
        setCode('') // Clear the code input
      } else {
        toast.error(data.error || 'Ugyldig kupongkode')
      }
    } catch (error) {
      console.error('Error redeeming coupon:', error)
      toast.error('Noe gikk galt ved oppgradering')
    } finally {
      setLoading(false)
    }
  }

  const premiumFeatures = [
    {
      icon: <DollarSign className="text-green-600" size={24} />,
      title: 'Prisoversikt i grupper',
      description: 'Se totalpris, pris per medlem og detaljert statistikk',
      color: 'bg-green-50 border-green-200'
    },
    {
      icon: <Gift className="text-purple-600" size={24} />,
      title: 'Secret Santa Pro',
      description: 'Avansert gaveutveksling med budsjettstyring',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      icon: <Users className="text-blue-600" size={24} />,
      title: 'Budsjett per person',
      description: 'Sett og spør budsjett for hver deltaker',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      icon: <Sparkles className="text-pink-600" size={24} />,
      title: 'Mystery Gift',
      description: 'Hemmelig gaveutveksling med små gaver',
      color: 'bg-pink-50 border-pink-200'
    },
    {
      icon: <Zap className="text-yellow-600" size={24} />,
      title: 'Prisfall-varsler',
      description: 'Få varsel når ønsker går på tilbud',
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      icon: <Crown className="text-amber-600" size={24} />,
      title: 'Premium-støtte',
      description: 'Prioritert kundeservice og eksklusive funksjoner',
      color: 'bg-amber-50 border-amber-200'
    }
  ]

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Logg inn for å se Premium</h1>
          <p className="text-gray-600">Du må være logget inn for å oppgradere til Premium</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Crown className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Premium</h1>
              <p className="text-gray-600">
                {isPremium ? 'Du er Premium-medlem! 🎉' : 'Oppgrader for flere funksjoner'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isPremium ? (
          /* Premium Status */
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            className="space-y-6"
          >
            {/* Premium Badge */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="text-white" size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Du er Premium! 🎉</h2>
              <p className="text-purple-100">
                Takk for at du støtter Wishit. Nyt alle Premium-funksjonene!
              </p>
            </div>

            {/* Premium Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dine Premium-funksjoner</h3>
              {premiumFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1 }}
                  className={`${feature.color} border rounded-xl p-4 flex items-center gap-4`}
                >
                  {feature.icon}
                  <div>
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                  <Check className="text-green-600 ml-auto" size={20} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Upgrade to Premium */
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            className="space-y-6"
          >
            {/* Hero Section */}
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Crown className="text-white" size={48} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Oppgrader til Premium
              </h2>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                Få tilgang til eksklusive funksjoner som gjør gavekjøp enda enklere
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {premiumFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1 }}
                  className={`${feature.color} border rounded-xl p-4`}
                >
                  <div className="flex items-start gap-3">
                    {feature.icon}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Plan</h3>
                {isNative && products.length > 0 ? (
                  <div className="space-y-2">
                    {products.map((product, index) => (
                      <div key={index} className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {product.storeProduct.priceString}
                        </span>
                        <span className="text-gray-600">
                          {product.storeProduct.subscriptionPeriod}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-900">Gratis</span>
                    <span className="text-gray-500 line-through">99 kr/måned</span>
                  </div>
                )}
                <p className="text-gray-600 mt-2">
                  {isNative ? 'Kjøp direkte i appen' : 'Spesialtilbud: Gratis med kupongkode!'}
                </p>
              </div>

              {/* Native Purchase Buttons */}
              {isNative && isInitialized && products.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {products.map((product, index) => (
                    <button
                      key={index}
                      onClick={() => handlePurchase(product)}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Kjøper...
                        </>
                      ) : (
                        <>
                          <Apple size={20} />
                          Kjøp {product.storeProduct.title}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              ) : isNative ? (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 py-4 rounded-xl font-semibold text-lg mb-6 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock size={20} />
                  Laster produkter...
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 py-4 rounded-xl font-semibold text-lg mb-6 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock size={20} />
                  Kjøp Premium (kun i mobilappen)
                </button>
              )}

              {/* Coupon Code */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4 text-center">
                  Har du en kupongkode?
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Skriv inn kupongkode"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center font-mono"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={loading || !code.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Løser inn...
                      </>
                    ) : (
                      <>
                        <Star size={20} />
                        Løs inn kode
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">
                  Gyldige koder: <span className="font-mono font-semibold">Premium2025</span>, <span className="font-mono font-semibold">Wishit2025</span>, <span className="font-mono font-semibold">Test123</span>
                </p>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Anna S.</h4>
                  <p className="text-sm text-gray-600">Premium-medlem</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Premium-funksjonene har gjort gavekjøp så mye enklere! 
                Prisoversikten hjelper meg å holde oversikt over budsjettet, 
                og Secret Santa Pro er perfekt for familien vår."
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
