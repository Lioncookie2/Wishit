import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'

export class NotificationService {
  private static instance: NotificationService
  private isInitialized = false
  private pushToken: string | null = null

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !Capacitor.isNativePlatform()) {
      return
    }

    try {
      // Sjekk om notifikasjoner er støttet
      const permStatus = await PushNotifications.checkPermissions()
      
      if (permStatus.receive === 'denied') {
        console.log('Push notifications are denied')
        return
      }

      if (permStatus.receive === 'prompt') {
        // Be om tillatelse
        const requestResult = await PushNotifications.requestPermissions()
        if (requestResult.receive !== 'granted') {
          console.log('Push notification permission denied')
          return
        }
      }

      // Registrer for push notifications
      await PushNotifications.register()

      // Lytt til registrering
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value)
        this.pushToken = token.value
        this.saveTokenToServer(token.value)
      })

      // Lytt til feil
      PushNotifications.addListener('registrationError', (err) => {
        console.error('Error on registration: ' + JSON.stringify(err))
      })

      // Lytt til notifikasjoner
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification)
        // Håndter notifikasjon når appen er åpen
      })

      // Lytt til notifikasjon-klikk
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification)
        // Håndter notifikasjon-klikk
        this.handleNotificationClick(notification)
      })

      this.isInitialized = true
    } catch (error) {
      console.error('Error initializing push notifications:', error)
    }
  }

  private async saveTokenToServer(token: string): Promise<void> {
    try {
      // Send token til server for lagring
      const response = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        console.error('Failed to save push token to server')
      }
    } catch (error) {
      console.error('Error saving push token:', error)
    }
  }

  private handleNotificationClick(notification: any): void {
    // Håndter notifikasjon-klikk basert på data
    const data = notification.notification.data
    
    if (data?.type === 'price_drop') {
      // Naviger til ønskeliste eller spesifikt ønske
      if (data.wishlistId) {
        window.location.href = `/wishlist?highlight=${data.wishlistId}`
      }
    } else if (data?.type === 'group_update') {
      // Naviger til gruppe
      if (data.groupId) {
        window.location.href = `/group/${data.groupId}`
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false
    }

    try {
      const result = await PushNotifications.requestPermissions()
      return result.receive === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  getToken(): string | null {
    return this.pushToken
  }

  isSupported(): boolean {
    return Capacitor.isNativePlatform()
  }
}

// Eksporter singleton instance
export const notificationService = NotificationService.getInstance()
