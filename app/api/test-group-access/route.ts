import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  console.log('🔍 test-group-access API called')
  
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    console.log('🔍 Group ID from params:', groupId)

    if (!groupId) {
      console.log('❌ No group ID provided')
      return NextResponse.json({
        success: false,
        error: 'Group ID is required'
      }, { status: 400 })
    }

    console.log('🧪 Testing group access for groupId:', groupId)
    
    // Test enkel tilgang til gruppe uten RLS
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    console.log('🧪 Group access test result:', { data, error })

    if (error) {
      console.error('❌ Group access test failed:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: 'RLS blokkerer tilgang til gruppe. Kjør EMERGENCY-RLS-FIX.sql i Supabase.'
      }, { status: 500 })
    }

    console.log('✅ Group access test successful')
    return NextResponse.json({
      success: true,
      message: 'Gruppe tilgang fungerer! RLS er deaktivert.',
      data: data
    })

  } catch (error) {
    console.error('❌ Unexpected error in test-group-access:', error)
    return NextResponse.json({
      success: false,
      error: 'Uventet feil ved testing av gruppe tilgang',
      message: 'Sjekk at Supabase er konfigurert riktig'
    }, { status: 500 })
  }
}
