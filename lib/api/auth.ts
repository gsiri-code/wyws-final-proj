import { ApiError } from "@/lib/api/http";
import { createClient } from '@/lib/supabase/server'


export async function getRequestUserId() {
  const supabaseClient = await createClient();

  const { data: { user }, error } = await supabaseClient.auth.getUser()

  if (error) throw new ApiError(`error fetching current user ${error.message}`)

  return user!.id
}

export async function isUserAuthenticated(): Promise<boolean> {
  const supabaseClient = await createClient();

  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error || !user) return false

  return true
}
