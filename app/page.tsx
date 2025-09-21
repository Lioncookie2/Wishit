'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SplashScreen from '@/components/SplashScreen'
import HomePage from '@/components/HomePage'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'

export default function Page() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  const appName = 'Wishit'

  useEffect(() => {
    if (!loading && user) {
      router.push('/home')
    }
  }, [user, loading, router])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  const handleGetStarted = () => {
    setShowAuth(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-christmas-red via-christmas-green to-christmas-red">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <>
      <HomePage appName={appName} onGetStarted={handleGetStarted} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  )
}
