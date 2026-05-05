import { isUserAuthenticated } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseClient = await createClient()

  if (await isUserAuthenticated() == false) {
    return NextResponse.json(
      { message: 'User is not authenticated' },
      { status: 401 }
    )
  }

  const { error } = await supabaseClient.auth.signOut()

  if (error) {
    return NextResponse.json(
      { message: `Error logging out user: ${error.message}` },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { message: 'User logged out successfully' },
    { status: 200 }
  )
}
