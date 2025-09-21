'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import AddWishModal from './AddWishModal'

export default function BottomNavigation() {
  const pathname = usePathname()
  const [showAddWish, setShowAddWish] = useState(false)

  const navItems = [
    { href: '/home', label: 'Hjem', icon: '🏠' },
    { href: '/wishlist', label: 'Ønskeliste', icon: '🎁' },
    { href: '/groups', label: 'Grupper', icon: '👥' },
    { href: '/price-overview', label: 'Ønskepris', icon: '📊' },
    { href: '/premium', label: 'Premium', icon: '⭐' },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
        <div className="flex items-center justify-around py-1">
          {/* First row of navigation items */}
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center py-2 px-2 min-w-0 flex-1"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center"
                >
                  <span className={`text-xl mb-1 ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                    {item.icon}
                  </span>
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  } transition-colors duration-200 text-center`}>
                    {item.label}
                  </span>
                </motion.div>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="w-1 h-1 bg-blue-600 rounded-full mt-1"
                  />
                )}
              </Link>
            )
          })}

          {/* Plus button in center */}
          <motion.button
            onClick={() => setShowAddWish(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center py-2 px-2 min-w-0 flex-1"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <Plus className="text-white" size={20} />
            </div>
            <span className="text-xs font-medium text-gray-500 mt-1">
              Legg til
            </span>
          </motion.button>

          {/* Second row of navigation items */}
          {navItems.slice(2).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center py-2 px-2 min-w-0 flex-1"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center"
                >
                  <span className={`text-xl mb-1 ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                    {item.icon}
                  </span>
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  } transition-colors duration-200 text-center`}>
                    {item.label}
                  </span>
                </motion.div>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="w-1 h-1 bg-blue-600 rounded-full mt-1"
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Add Wish Modal */}
      <AddWishModal
        isOpen={showAddWish}
        onClose={() => setShowAddWish(false)}
        onSuccess={() => {
          // Reload data if needed
          window.location.reload()
        }}
      />
    </>
  )
}