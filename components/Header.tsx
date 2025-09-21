'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import SettingsModal from './SettingsModal'

export default function Header() {
  const { user } = useAuth()
  const router = useRouter()
  const [showSettings, setShowSettings] = useState(false)

  const handleSettingsClick = () => {
    setShowSettings(true)
  }

  const handleNotificationsClick = () => {
    router.push('/notifications')
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50 shadow-sm">
      {/* Logo og velkommen */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">W</span>
        </div>
        <div>
          <h1 className="font-bold text-lg text-gray-900">Wishit</h1>
          {user && (
            <p className="text-xs text-gray-600">
              Velkommen tilbake, {user.email?.split('@')[0] || 'Bruker'}!
            </p>
          )}
        </div>
      </motion.div>

      {/* Right side buttons */}
      <div className="flex items-center gap-2">
        {/* Notifications Button */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNotificationsClick}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
        >
          <Bell size={20} />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </motion.button>

        {/* Settings Button */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSettingsClick}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings size={20} />
        </motion.button>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </header>
  )
}
