import { supabase } from './supabase'
import { User, Group, WishlistItem, Invitation, GroupMember } from '@/types'

export const database = {
  // Profil operasjoner
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Database error getProfile:', error)
    }

    return { data, error }
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    // @ts-ignore - Supabase type issues with profiles table
    const { data, error } = await (supabase
      .from('profiles') as any)
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  },

  // Gruppe operasjoner - forenklet query
  async getUserGroups() {
    console.log('🔍 getUserGroups called')
    
    // Først sjekk at brukeren er autentisert
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔍 Auth check result:', { user: user?.id, authError })
    
    if (authError || !user) {
      console.error('❌ Auth error in getUserGroups:', authError)
      return { data: null, error: new Error('Ingen innlogget bruker – kan ikke hente grupper') }
    }

    const userId = user.id
    console.log('🔍 User ID:', userId)

    // Først hent grupper hvor brukeren er admin
    console.log('🔍 Fetching admin groups...')
    const { data: adminGroups, error: adminError } = await supabase
      .from('groups')
      .select('*')
      .eq('admin_id', userId)
    
    console.log('🔍 Admin groups result:', { adminGroups, adminError })

    // Så hent grupper hvor brukeren er medlem
    console.log('🔍 Fetching member groups...')
    const { data: memberGroups, error: memberError } = await supabase
      .from('group_members')
      .select(`
        *,
        groups:group_id (*)
      `)
      .eq('user_id', userId)
    
    console.log('🔍 Member groups result:', { memberGroups, memberError })

    if (adminError || memberError) {
      console.error('Database error getUserGroups:', adminError || memberError)
      console.error('Error details:', {
        adminError: adminError ? { code: adminError.code, message: adminError.message } : null,
        memberError: memberError ? { code: memberError.code, message: memberError.message } : null
      })
      return { data: null, error: adminError || memberError }
    }

    // Kombiner resultatene og fjern duplikater
    const allGroups = [
      ...(adminGroups || []).map((group: any) => ({ ...group, role: 'admin' })),
      ...(memberGroups || []).map((item: any) => ({ ...item.groups, role: item.role }))
    ]

    // Fjern duplikater basert på id, prioriter admin-rollen
    const uniqueGroups = allGroups.reduce((acc, group) => {
      const existing = acc.find(g => g.id === group.id)
      if (!existing) {
        acc.push(group)
      } else if (group.role === 'admin' && existing.role !== 'admin') {
        // Erstatt med admin-versjon hvis den finnes
        const index = acc.findIndex(g => g.id === group.id)
        acc[index] = group
      }
      return acc
    }, [])

    // Hent medlemsdata og ønsker for hver gruppe
    const groupsWithDetails = await Promise.all(
      uniqueGroups.map(async (group) => {
        // Hent medlemmer
        const { data: members } = await supabase
          .from('group_members')
          .select(`
            *,
            profiles:user_id (id, full_name, email, avatar_url)
          `)
          .eq('group_id', group.id)

        // Hent ønsker
        const { data: wishlists } = await supabase
          .from('wishlists')
          .select('id')
          .eq('group_id', group.id)

        return {
          ...group,
          members: members || [],
          wishlistCount: wishlists?.length || 0
        }
      })
    )

    return { data: groupsWithDetails, error: null }
  },

  async createGroup(group: Omit<Group, 'id' | 'created_at' | 'members'>) {
    // Først sjekk at brukeren er autentisert
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error in createGroup:', authError)
      return { data: null, error: new Error('Ingen innlogget bruker – kan ikke opprette gruppe') }
    }

    // Generer firesifret kode
    const joinCode = Math.floor(1000 + Math.random() * 9000).toString()
    
    const groupWithCode = {
      ...group,
      join_code: joinCode
    }

    const { data, error } = await (supabase
      .from('groups') as any)
      .insert(groupWithCode)
      .select()
      .single()

    if (data && !error) {
      // Legg til admin som medlem
      const { error: memberError } = await (supabase
        .from('group_members') as any)
        .insert({
          group_id: data.id,
          user_id: group.admin_id,
          role: 'admin',
          status: 'active' // Admin er automatisk aktiv
        })
      
      if (memberError) {
        console.error('Error adding admin as member:', memberError)
      }
    }

    return { data, error }
  },

  async getGroupMembers(groupId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('group_id', groupId)

    if (error) {
      console.error('Error fetching group members:', error)
      return { data: null, error }
    }

    // Sjekk om profil-data mangler og prøv å opprette profil
    if (data) {
      for (const member of data) {
        if (!(member as any).profiles) {
          console.log('Missing profile for user:', member.user_id)
          
          // Prøv å opprette profil for brukeren
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: member.user_id,
                email: 'Ukjent e-post',
                full_name: 'Ukjent bruker',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (profileData && !profileError) {
              member.profiles = profileData
            } else {
              // Fallback hvis profil-opprettelse feiler
              member.profiles = {
                id: member.user_id,
                email: 'Ukjent e-post',
                full_name: 'Ukjent bruker',
                avatar_url: null
              }
            }
          } catch (createError) {
            console.error('Error creating profile:', createError)
            // Fallback hvis profil-opprettelse feiler
            member.profiles = {
              id: member.user_id,
              email: 'Ukjent e-post',
              full_name: 'Ukjent bruker',
              avatar_url: null
            }
          }
        }
        
        // Konverter profiles til profile for konsistens med GroupMember interface
        member.profile = member.profiles
      }
    }

    return { data, error }
  },

  async inviteToGroup(groupId: string, email: string, invitedBy: string) {
    // Generer unik invite token
    const inviteToken = crypto.randomUUID()
    const inviteUrl = `${window.location.origin}/invite/${inviteToken}`

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        group_id: groupId,
        email,
        invited_by: invitedBy,
        invite_token: inviteToken,
        invite_url: inviteUrl
      })
      .select()
      .single()

    return { data, error }
  },

  async getUserInvitations(email: string) {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        groups:group_id (*),
        profiles:invited_by (full_name, email)
      `)
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())

    return { data, error }
  },

  // Hent invitasjon via token (for invitasjonslenke)
  async getInvitationByToken(token: string) {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        groups:group_id (*),
        profiles:invited_by (full_name, email)
      `)
      .eq('invite_token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    return { data, error }
  },

  async respondToInvitation(invitationId: string, status: 'accepted' | 'rejected') {
    const { data, error } = await supabase
      .from('invitations')
      .update({ status })
      .eq('id', invitationId)
      .select(`
        *,
        groups:group_id (*)
      `)
      .single()

    // Hvis akseptert, legg til som medlem
    if (data && status === 'accepted' && !error) {
      // Først sjekk at brukeren er autentisert
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { data: null, error: new Error('Ingen innlogget bruker – kan ikke akseptere invitasjon') }
      }

      await supabase
        .from('group_members')
        .insert({
          group_id: data.group_id,
          user_id: user.id,
          role: 'member',
          status: 'active'
        })
    }

    return { data, error }
  },

  // Aksepter invitasjon via token (for invitasjonslenke)
  async acceptInvitationByToken(token: string, userId: string) {
    // Først hent invitasjonen
    const { data: invitation, error: invitationError } = await this.getInvitationByToken(token)
    if (invitationError || !invitation) {
      return { data: null, error: new Error('Ugyldig eller utløpt invitasjon') }
    }

    // Sjekk om brukeren allerede er medlem
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', invitation.group_id)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      return { data: null, error: new Error('Du er allerede medlem av denne gruppen') }
    }

    // Legg til som medlem
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .insert({
        group_id: invitation.group_id,
        user_id: userId,
        role: 'member',
        status: 'active'
      })
      .select()
      .single()

    if (membershipError) {
      return { data: null, error: membershipError }
    }

    // Marker invitasjon som akseptert
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    return { data: { invitation, membership }, error: null }
  },

  // Ønskeliste operasjoner
  async getUserWishlists(userId: string, groupId?: string) {
    // Først sjekk at brukeren er autentisert
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error in getUserWishlists:', authError)
      return { data: null, error: new Error('Ingen innlogget bruker – kan ikke hente ønskelister') }
    }

    let query = supabase
      .from('wishlists')
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)

    if (groupId) {
      // Hent ønsker for en spesifikk gruppe
      query = query.eq('group_id', groupId)
    } else {
      // Hent personlige ønsker (uten gruppe)
      query = query.eq('user_id', userId).is('group_id', null)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error getUserWishlists:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    }

    return { data, error }
  },

  async getGroupWishlists(groupId: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        profiles:user_id (full_name, email, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching group wishlists:', error)
      return { data: null, error }
    }

    return { data, error }
  },

  async createWishlistItem(item: Omit<WishlistItem, 'id' | 'created_at' | 'updated_at'>) {
    // Først sjekk at brukeren er autentisert
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error in createWishlistItem:', authError)
      return { data: null, error: new Error('Ingen innlogget bruker – kan ikke opprette ønske') }
    }

    // Sørg for at user_id matcher den innloggede brukeren
    const wishlistItem = {
      ...item,
      user_id: user.id
    }

    const { data, error } = await supabase
      .from('wishlists')
      .insert(wishlistItem)
      .select()
      .single()

    return { data, error }
  },

  async updateWishlistItem(itemId: string, updates: Partial<WishlistItem>) {
    const { data, error } = await supabase
      .from('wishlists')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    return { data, error }
  },

  async contributeToPurchase(wishlistId: string, userId: string, amount: number, comment?: string) {
    // Hent brukerens navn
    const { data: userData } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    const userName = userData?.full_name || userData?.email || 'Ukjent bruker'

    // Hent eksisterende bidrag
    const { data: wishlistData } = await supabase
      .from('wishlists')
      .select('contributions, total_contributed, current_price, price')
      .eq('id', wishlistId)
      .single()

    let contributions = []
    if (wishlistData?.contributions) {
      try {
        contributions = typeof wishlistData.contributions === 'string' 
          ? JSON.parse(wishlistData.contributions) 
          : wishlistData.contributions
      } catch (error) {
        console.error('Error parsing contributions:', error)
        contributions = []
      }
    }

    // Legg til nytt bidrag
    const newContribution = {
      userId,
      amount,
      comment: comment || '',
      userName,
      createdAt: new Date().toISOString()
    }

    contributions.push(newContribution)
    const newTotalContributed = (wishlistData?.total_contributed || 0) + amount
    const currentPrice = wishlistData?.current_price || wishlistData?.price || 0
    const isFullyFunded = newTotalContributed >= currentPrice

    // Oppdater ønsket
    const { data, error } = await supabase
      .from('wishlists')
      .update({
        contributions: JSON.stringify(contributions),
        total_contributed: newTotalContributed,
        is_fully_funded: isFullyFunded
      })
      .eq('id', wishlistId)
      .select()

    return { data, error }
  },

  async deleteWishlistItem(itemId: string) {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', itemId)

    return { error }
  },

  async getUserWishlistItems() {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: new Error('Ikke autentisert') }
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        profiles:user_id (full_name, email, avatar_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return { data, error }
  },

  async markAsPurchased(itemId: string, purchasedBy: string, comment?: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .update({
        is_purchased: true,
        purchased_by: purchasedBy,
        purchased_at: new Date().toISOString(),
        purchase_comment: comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single()

    return { data, error }
  },

  // Avansert kjøp med bidrag
  async contributeToPurchase(itemId: string, contributorId: string, amount: number, comment?: string) {
    // Først hent ønsket for å sjekke pris
    const { data: item, error: itemError } = await supabase
      .from('wishlists')
      .select('price, purchase_comment')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      return { data: null, error: new Error('Kunne ikke hente ønsket') }
    }

    if (!item.price) {
      return { data: null, error: new Error('Ønsket har ingen pris') }
    }

    // For nå, legg til bidrag som en kommentar
    const existingComment = item.purchase_comment || ''
    const newComment = existingComment 
      ? `${existingComment}\nBidrag: ${amount}kr${comment ? ' - ' + comment : ''}`
      : `Bidrag: ${amount}kr${comment ? ' - ' + comment : ''}`

    // Oppdater ønsket med bidrag-kommentar
    const { data, error } = await supabase
      .from('wishlists')
      .update({
        purchase_comment: newComment,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single()

    return { data, error }
  },

  // Hent bidrag for et ønske
  async getPurchaseContributions(itemId: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        price,
        purchase_contributions,
        purchase_total_contributed,
        purchase_remaining_amount,
        profiles:user_id (id, full_name, email, avatar_url)
      `)
      .eq('id', itemId)
      .single()

    return { data, error }
  },

  // Marker som fullstendig kjøpt (når alle bidrag er samlet)
  async markAsFullyPurchased(itemId: string, purchasedBy: string, comment?: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .update({
        is_purchased: true,
        purchased_by: purchasedBy,
        purchased_at: new Date().toISOString(),
        purchase_comment: comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single()

    return { data, error }
  },

  async unmarkAsPurchased(itemId: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .update({
        is_purchased: false,
        purchased_by: null,
        purchased_at: null,
        purchase_comment: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single()

    return { data, error }
  },

  async addThankYouMessage(itemId: string, message: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .update({
        thank_you_message: message,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single()

    return { data, error }
  },

  // Gruppedetaljer
  async getGroupDetails(groupId: string) {
    console.log('🔍 getGroupDetails called with groupId:', groupId)
    
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        profiles:admin_id (full_name, email)
      `)
      .eq('id', groupId)
      .single()

    console.log('🔍 getGroupDetails result:', { data, error })

    if (data) {
      data.admin_name = data.profiles?.full_name || data.profiles?.email
      console.log('🔍 Processed group data:', data)
    }

    return { data, error }
  },

  // Legg til bruker i gruppe
  async addUserToGroup(groupId: string, userId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
        status: 'active' // Direkte tilføyde medlemmer er aktive
      })

    return { data, error }
  },

  // Bli med i gruppe med kode (med pending status)
  async joinGroupWithCode(joinCode: string, userId: string) {
    // Først sjekk at brukeren er autentisert
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error in joinGroupWithCode:', authError)
      return { data: null, error: new Error('Ingen innlogget bruker – kan ikke bli med i gruppe') }
    }

    // Finn gruppe med kode
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('join_code', joinCode)
      .single()

    if (groupError || !group) {
      return { data: null, error: new Error('Ugyldig gruppe-kode') }
    }

    // Sjekk om brukeren allerede er medlem eller har pending forespørsel
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id, status')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      if (existingMember.status === 'active') {
        return { data: null, error: new Error('Du er allerede medlem av denne gruppen') }
      } else if (existingMember.status === 'pending') {
        return { data: null, error: new Error('Du har allerede sendt en forespørsel om å bli med i denne gruppen') }
      }
    }

    // Legg til bruker som medlem med pending status
    const insertData: any = {
      group_id: group.id,
      user_id: userId,
      role: 'member'
    }

    // Prøv å legge til nye felter hvis de eksisterer
    try {
      insertData.status = 'pending'
      insertData.requested_at = new Date().toISOString()
    } catch (e) {
      // Ignorer hvis kolonnene ikke eksisterer ennå
    }

    const { data, error } = await supabase
      .from('group_members')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Error joining group:', error)
      return { data: null, error }
    }

    return { data: { group, membership: data[0] }, error: null }
  },

  // Admin: Godkjenn medlemskap
  async approveMembership(membershipId: string, adminId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: adminId
      })
      .eq('id', membershipId)
      .select()

    return { data, error }
  },

  // Admin: Avslå medlemskap
  async rejectMembership(membershipId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .update({
        status: 'kicked'
      })
      .eq('id', membershipId)
      .select()

    return { data, error }
  },

  // Admin: Fjern medlem fra gruppe
  async removeMemberFromGroup(membershipId: string) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', membershipId)

    return { error }
  },

  // Hent ventende medlemsforespørsler for admin
  async getPendingMemberships(groupId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url,
          workplace,
          address,
          phone,
          bio
        )
      `)
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })

    return { data, error }
  },

  // Secret Santa funksjoner
  async createSecretSantaDraw(groupId: string, budget: number = 500) {
    // Hent alle gruppemedlemmer
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)

    if (membersError || !members || members.length < 3) {
      return { error: new Error('Trenger minst 3 medlemmer for Secret Santa') }
    }

    // Bland medlemmene
    const shuffled = [...members].sort(() => Math.random() - 0.5)
    
    // Opprett Secret Santa-par
    const pairs = []
    for (let i = 0; i < shuffled.length; i++) {
      const giver = shuffled[i].user_id
      const receiver = shuffled[(i + 1) % shuffled.length].user_id
      
      pairs.push({
        group_id: groupId,
        giver_id: giver,
        receiver_id: receiver,
        budget: budget,
        created_at: new Date().toISOString()
      })
    }

    // Slett eksisterende trekning
    await supabase
      .from('secret_santa_pairs')
      .delete()
      .eq('group_id', groupId)

    // Lagre nye par
    const { data, error } = await supabase
      .from('secret_santa_pairs')
      .insert(pairs)

    return { data, error }
  },

  async getSecretSantaTarget(groupId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('secret_santa_pairs')
        .select(`
          *,
          receiver:receiver_id (
            id,
            full_name,
            email
          )
        `)
        .eq('group_id', groupId)
        .eq('giver_id', userId)
        .maybeSingle() // Bruk maybeSingle() i stedet for single()

      // Hvis ingen data funnet, returner null uten feil
      if (error) {
        console.error('Error fetching secret santa target:', error)
        return { data: null, error: null }
      }

      return { data, error: null }
    } catch (error) {
      // Hvis tabellen ikke eksisterer eller andre feil, returner null
      return { data: null, error: null }
    }
  },

  // Hent Secret Santa status for gruppe
  async getSecretSantaStatus(groupId: string) {
    const { data, error } = await supabase
      .from('secret_santa_pairs')
      .select('*')
      .eq('group_id', groupId)

    return { data, error }
  }
}
