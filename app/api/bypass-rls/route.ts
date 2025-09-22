import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Sjekk om miljøvariabler er satt
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Supabase ikke konfigurert',
        message: 'Miljøvariabler mangler'
      }, { status: 500 })
    }

    // Test med service role key for å omgå RLS
    const { data, error } = await supabase
      .from('wishlists')
      .select('id, title, user_id')
      .limit(5)

    if (error) {
      console.error('Bypass RLS error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'RLS bypass fungerer',
      data: data,
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Bypass error:', error)
    return NextResponse.json({
      success: false,
      error: 'Uventet feil ved RLS bypass'
    }, { status: 500 })
  }
}
