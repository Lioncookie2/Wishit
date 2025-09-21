'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { database } from '@/lib/database'

export default function DebugPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testDatabase = async () => {
    addLog('🧪 Testing database access...')
    
    try {
      // Test groups
      addLog('📋 Testing getUserGroups...')
      const groupsResult = await database.getUserGroups()
      addLog(`📋 Groups result: ${JSON.stringify(groupsResult)}`)
      
      // Test wishlist
      addLog('🎁 Testing getUserWishlistItems...')
      const wishlistResult = await database.getUserWishlistItems()
      addLog(`🎁 Wishlist result: ${JSON.stringify(wishlistResult)}`)
      
    } catch (error) {
      addLog(`❌ Error: ${error}`)
    }
  }

  const testGroupAccess = async (groupId: string) => {
    addLog(`🧪 Testing group access for: ${groupId}`)
    
    try {
      const response = await fetch(`/api/test-group-access?groupId=${groupId}`)
      const result = await response.json()
      addLog(`🧪 Group access result: ${JSON.stringify(result)}`)
    } catch (error) {
      addLog(`❌ Group access error: ${error}`)
    }
  }

  useEffect(() => {
    if (user) {
      addLog(`👤 User logged in: ${user.email}`)
      testDatabase()
    } else {
      addLog('❌ No user logged in')
    }
  }, [user])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      <div className="mb-4">
        <button
          onClick={testDatabase}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Test Database
        </button>
        
        <button
          onClick={() => testGroupAccess('test-group-id')}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Group Access
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto">
        <h3 className="font-bold mb-2">Debug Logs:</h3>
        {logs.map((log, index) => (
          <div key={index} className="text-sm font-mono mb-1">
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
