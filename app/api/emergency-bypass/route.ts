import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  console.log('🚨 EMERGENCY BYPASS called')
  
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    
    if (!groupId) {
      return NextResponse.json({
        success: false,
        error: 'Group ID is required'
      }, { status: 400 })
    }

    console.log('🚨 Attempting emergency bypass for groupId:', groupId)
    
    // Prøv å hente gruppe med service role key (omgår RLS)
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    console.log('🚨 Emergency bypass result:', { data, error })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        message: 'Emergency bypass failed. RLS må deaktiveres i Supabase Dashboard.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Emergency bypass successful!',
      data: data
    })

  } catch (error) {
    console.error('🚨 Emergency bypass error:', error)
    return NextResponse.json({
      success: false,
      error: 'Emergency bypass failed',
      message: 'Kontakt administrator eller deaktiver RLS i Supabase'
    }, { status: 500 })
  }
}
