
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string }

  try {
    body = await request.json()
  } catch {
    return Response.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, password } = body

  if (typeof email !== 'string' || typeof password !== 'string') {
    return Response.json(
      { message: 'Email and password are required' },
      { status: 400 }
    )
  }

  const supabaseClient = await createClient()
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json(
      { message: `Auth error: ${error.message}` },
      { status: error.status || 400 }
    )
  }

  return NextResponse.json(
    {
      message: 'User logged in successfully',
      user: data.user,
    },
    { status: 200 }
  )
}
