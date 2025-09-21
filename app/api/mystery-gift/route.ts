import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { groupId, action, giftIdea, budget } = await request.json()

    if (action === 'enable') {
      // Aktiver Mystery Gift for gruppen
      const { data, error } = await (supabase
        .from('groups') as any)
        .update({
          mystery_gift_enabled: true,
          mystery_gift_budget: budget || 200
        })
        .eq('id', groupId)
        .select()

      if (error) {
        console.error('Error enabling mystery gift:', error)
        return NextResponse.json({ error: 'Kunne ikke aktivere Mystery Gift' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Mystery Gift aktivert!',
        data 
      })
    }

    if (action === 'add_gift') {
      // Legg til gaveidé
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
      }

      const { data, error } = await (supabase
        .from('wishlists') as any)
        .insert({
          user_id: user.id,
          group_id: groupId,
          title: giftIdea.title,
          description: giftIdea.description,
          url: giftIdea.url || '',
          current_price: giftIdea.budget,
          price_provider: 'mystery_gift',
          is_purchased: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('Error adding mystery gift:', error)
        return NextResponse.json({ error: 'Kunne ikke legge til gaveidé' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Gaveidé lagt til!',
        data 
      })
    }

    if (action === 'draw') {
      // Trekke Mystery Gift-fordeling
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
      }

      // Hent alle Mystery Gift-gaver i gruppen
      const { data: gifts, error: giftsError } = await (supabase
        .from('wishlists') as any)
        .select(`
          id,
          user_id,
          title,
          description,
          current_price,
          profiles:user_id (full_name, email)
        `)
        .eq('group_id', groupId)
        .eq('price_provider', 'mystery_gift')

      if (giftsError || !gifts || gifts.length === 0) {
        return NextResponse.json({ error: 'Ingen gaver å trekke' }, { status: 400 })
      }

      // Bland gavene
      const shuffled = [...gifts].sort(() => Math.random() - 0.5)
      
      // Opprett Mystery Gift-par
      const pairs = []
      for (let i = 0; i < shuffled.length; i++) {
        const giver = shuffled[i].user_id
        const receiver = shuffled[(i + 1) % shuffled.length].user_id
        
        pairs.push({
          group_id: groupId,
          giver_id: giver,
          receiver_id: receiver,
          gift_id: shuffled[i].id,
          created_at: new Date().toISOString()
        })
      }

      // Slett eksisterende Mystery Gift-trekning
      await (supabase
        .from('mystery_gift_pairs') as any)
        .delete()
        .eq('group_id', groupId)

      // Lagre nye par
      const { data: mysteryPairs, error: pairsError } = await (supabase
        .from('mystery_gift_pairs') as any)
        .insert(pairs)
        .select()

      if (pairsError) {
        console.error('Error creating mystery gift pairs:', pairsError)
        return NextResponse.json({ error: 'Kunne ikke opprette Mystery Gift-trekning' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Mystery Gift-trekning fullført!',
        data: mysteryPairs
      })
    }

    if (action === 'get_my_gift') {
      // Hent min Mystery Gift-mottaker
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
      }

      const { data, error } = await (supabase
        .from('mystery_gift_pairs') as any)
        .select(`
          *,
          gift:wishlists!gift_id (
            id,
            title,
            description,
            current_price
          ),
          receiver:profiles!receiver_id (
            full_name,
            email
          )
        `)
        .eq('group_id', groupId)
        .eq('giver_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ 
            success: true, 
            message: 'Ingen Mystery Gift-trekning funnet',
            data: null 
          })
        }
        console.error('Error fetching mystery gift:', error)
        return NextResponse.json({ error: 'Kunne ikke hente Mystery Gift' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        data 
      })
    }

    return NextResponse.json({ error: 'Ugyldig handling' }, { status: 400 })

  } catch (error) {
    console.error('Mystery gift error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke behandle Mystery Gift-forespørsel' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Mystery Gift API er tilgjengelig',
    usage: 'Send POST request med action: enable, add_gift, draw, eller get_my_gift'
  })
}
