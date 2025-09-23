import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Hent notifikasjoner fra databasen
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        message,
        data,
        read,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Kunne ikke hente varsler' }, { status: 500 })
    }

    return NextResponse.json({ notifications: notifications || [] })

  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json({ error: 'En uventet feil oppstod' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { notificationId, read } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: 'Notifikasjons-ID påkrevd' }, { status: 400 })
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read })
      .eq('id', notificationId)

    if (error) {
      console.error('Error updating notification:', error)
      return NextResponse.json({ error: 'Kunne ikke oppdatere varsel' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json({ error: 'En uventet feil oppstod' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: 'Notifikasjons-ID påkrevd' }, { status: 400 })
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('Error deleting notification:', error)
      return NextResponse.json({ error: 'Kunne ikke slette varsel' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json({ error: 'En uventet feil oppstod' }, { status: 500 })
  }
}
