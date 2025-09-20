'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { database } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import { Bug, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function AuthDebug() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkAuth = async () => {
    setLoading(true)
    try {
      // Sjekk bruker
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      // Sjekk session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Test wishlists query - personlige ønsker (bruk database funksjon)
      const { data: personalWishlists, error: personalWishlistsError } = user 
        ? await database.getUserWishlists(user.id)
        : { data: null, error: new Error('Ingen bruker') }
      
      // Test wishlists query - alle ønsker (direkte query)
      const { data: allWishlists, error: allWishlistsError } = await supabase
        .from('wishlists')
        .select('*')
        .limit(5)
      
      // Test groups query
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .limit(5)

      setDebugInfo({
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role
        } : null,
        userError,
        session: session ? {
          access_token: session.access_token ? 'Present' : 'Missing',
          refresh_token: session.refresh_token ? 'Present' : 'Missing',
          expires_at: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Unknown'
        } : null,
        sessionError,
        personalWishlists: {
          data: personalWishlists,
          error: personalWishlistsError,
          count: personalWishlists?.length || 0
        },
        allWishlists: {
          data: allWishlists,
          error: allWishlistsError,
          count: allWishlists?.length || 0
        },
        groups: {
          data: groups,
          error: groupsError,
          count: groups?.length || 0
        }
      })
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  const getStatusIcon = (hasError: boolean, hasData: boolean) => {
    if (hasError) return <XCircle className="text-red-500" size={16} />
    if (hasData) return <CheckCircle className="text-green-500" size={16} />
    return <AlertCircle className="text-yellow-500" size={16} />
  }

  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Bug className="text-gray-600" size={20} />
        <h3 className="font-semibold text-gray-900">Auth Debug</h3>
      </div>
      
      <button
        onClick={checkAuth}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 mb-4"
      >
        {loading ? 'Sjekker...' : 'Test Supabase Auth'}
      </button>

      {debugInfo && (
        <div className="space-y-4">
          {/* User Status */}
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(!!debugInfo.userError, !!debugInfo.user)}
              <span className="font-medium">Bruker</span>
            </div>
            {debugInfo.user ? (
              <div className="text-sm text-gray-600">
                <p>ID: {debugInfo.user.id}</p>
                <p>Email: {debugInfo.user.email}</p>
                <p>Role: {debugInfo.user.role}</p>
              </div>
            ) : (
              <p className="text-red-600 text-sm">
                {debugInfo.userError?.message || 'Ingen bruker funnet'}
              </p>
            )}
          </div>

          {/* Session Status */}
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(!!debugInfo.sessionError, !!debugInfo.session)}
              <span className="font-medium">Session</span>
            </div>
            {debugInfo.session ? (
              <div className="text-sm text-gray-600">
                <p>Access Token: {debugInfo.session.access_token}</p>
                <p>Refresh Token: {debugInfo.session.refresh_token}</p>
                <p>Expires: {debugInfo.session.expires_at}</p>
              </div>
            ) : (
              <p className="text-red-600 text-sm">
                {debugInfo.sessionError?.message || 'Ingen session funnet'}
              </p>
            )}
          </div>

          {/* Personal Wishlists Test */}
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(!!debugInfo.personalWishlists.error, debugInfo.personalWishlists.count > 0)}
              <span className="font-medium">Personlige Ønsker</span>
            </div>
            {debugInfo.personalWishlists.error ? (
              <p className="text-red-600 text-sm">
                {debugInfo.personalWishlists.error.message} (Code: {debugInfo.personalWishlists.error.code})
              </p>
            ) : (
              <p className="text-green-600 text-sm">
                Success! Found {debugInfo.personalWishlists.count} personlige ønsker
              </p>
            )}
          </div>

          {/* All Wishlists Test */}
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(!!debugInfo.allWishlists.error, debugInfo.allWishlists.count > 0)}
              <span className="font-medium">Alle Ønsker (inkl. grupper)</span>
            </div>
            {debugInfo.allWishlists.error ? (
              <p className="text-red-600 text-sm">
                {debugInfo.allWishlists.error.message} (Code: {debugInfo.allWishlists.error.code})
              </p>
            ) : (
              <p className="text-green-600 text-sm">
                Success! Found {debugInfo.allWishlists.count} ønsker totalt
              </p>
            )}
          </div>

          {/* Groups Test */}
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(!!debugInfo.groups.error, debugInfo.groups.count > 0)}
              <span className="font-medium">Groups Query</span>
            </div>
            {debugInfo.groups.error ? (
              <p className="text-red-600 text-sm">
                {debugInfo.groups.error.message} (Code: {debugInfo.groups.error.code})
              </p>
            ) : (
              <p className="text-green-600 text-sm">
                Success! Found {debugInfo.groups.count} groups
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
