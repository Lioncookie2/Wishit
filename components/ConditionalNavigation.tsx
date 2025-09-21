'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import BottomNavigation from './BottomNavigation'

export default function ConditionalNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Skjul navigasjon på splash screen og før bruker kommer til /home
  const shouldShowNavigation = pathname !== '/' && pathname !== '/auth' && pathname !== '/login' && pathname !== '/signup'
  
  if (!shouldShowNavigation) {
    return <>{children}</>
  }
  
  return (
    <>
      <Header />
      <div className="min-h-screen pt-14 pb-20">
        {children}
      </div>
      <BottomNavigation />
    </>
  )
}
