import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id

    // Hent alle ønsker i gruppen med priser
    const { data: wishlists, error: wishlistsError } = await supabase
      .from('wishlists')
      .select(`
        id,
        title,
        current_price,
        price,
        user_id,
        is_purchased,
        profiles:user_id (full_name, email)
      `)
      .eq('group_id', groupId)
      .not('current_price', 'is', null)

    if (wishlistsError) {
      console.error('Error fetching group wishlists:', wishlistsError)
      return NextResponse.json({ error: 'Kunne ikke hente ønsker' }, { status: 500 })
    }

    // Hent gruppemedlemmer
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        profiles:user_id (full_name, email)
      `)
      .eq('group_id', groupId)

    if (membersError) {
      console.error('Error fetching group members:', membersError)
      return NextResponse.json({ error: 'Kunne ikke hente medlemmer' }, { status: 500 })
    }

    // Beregn priser per medlem
    const memberPrices: { [key: string]: { name: string; total: number; count: number; purchased: number } } = {}
    
    // Initialiser alle medlemmer
    members?.forEach((member: any) => {
      const memberId = member.user_id
      const memberName = member.profiles?.full_name || member.profiles?.email || 'Ukjent'
      memberPrices[memberId] = {
        name: memberName,
        total: 0,
        count: 0,
        purchased: 0
      }
    })

    // Beregn priser for hver ønskeliste
    wishlists?.forEach((wishlist: any) => {
      const memberId = wishlist.user_id
      const price = wishlist.current_price || wishlist.price || 0
      
      if (memberPrices[memberId]) {
        memberPrices[memberId].total += price
        memberPrices[memberId].count += 1
        
        if (wishlist.is_purchased) {
          memberPrices[memberId].purchased += price
        }
      }
    })

    // Konverter til array og sorter
    const memberPriceArray = Object.values(memberPrices).sort((a, b) => b.total - a.total)
    
    // Beregn totaler
    const totalWishlistValue = memberPriceArray.reduce((sum, member) => sum + member.total, 0)
    const totalPurchased = memberPriceArray.reduce((sum, member) => sum + member.purchased, 0)
    const totalRemaining = totalWishlistValue - totalPurchased

    // Beregn gjennomsnitt
    const averagePerMember = memberPriceArray.length > 0 ? totalWishlistValue / memberPriceArray.length : 0

    return NextResponse.json({
      success: true,
      data: {
        members: memberPriceArray,
        totals: {
          totalWishlistValue,
          totalPurchased,
          totalRemaining,
          averagePerMember,
          memberCount: memberPriceArray.length
        },
        summary: {
          mostExpensive: memberPriceArray[0] || null,
          leastExpensive: memberPriceArray[memberPriceArray.length - 1] || null,
          totalWishlists: wishlists?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('Group prices error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente gruppens prisoversikt' },
      { status: 500 }
    )
  }
}
