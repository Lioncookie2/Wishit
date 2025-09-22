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

    // Test enkel tilgang uten RLS
    const { data, error } = await supabase
      .from('wishlists')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: 'RLS er fortsatt aktivert. Kjør EMERGENCY-RLS-FIX.sql i Supabase.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database tilgang fungerer! RLS er deaktivert.',
      data: data
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Uventet feil ved testing av database',
      message: 'Sjekk at Supabase er konfigurert riktig'
    }, { status: 500 })
  }
}
