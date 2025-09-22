'use client'

import { useEffect } from 'react'
import { notificationService } from '@/lib/notifications'
import { useAuth } from '@/hooks/useAuth'

export default function NotificationInitializer() {
  const { user } = useAuth()

  useEffect(() => {
    // Initialiser notifikasjoner når brukeren er logget inn
    if (user) {
      notificationService.initialize()
    }
  }, [user])

  // Dette komponentet returnerer ingenting, det bare initialiserer notifikasjoner
  return null
}
