import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Extract and validate the user from the Authorization header
 * Returns an admin client (service role) for database operations after validation
 * This is secure because we validate the token first before using elevated privileges
 * 
 * @param {Request} request - The incoming request
 * @returns {Promise<{user: User|null, error: string|null, supabase: SupabaseClient}>}
 */
export async function getAuthenticatedUser(request) {
    const cookieStore = await cookies()

    // Create client for token validation
    const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Ignore cookie setting errors in read-only contexts
                    }
                },
            },
        }
    )

    // Extract Authorization header
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
        return { user: null, error: 'No token provided', supabase: authClient }
    }

    // Validate the token with Supabase
    const { data: { user }, error } = await authClient.auth.getUser(token)

    if (error || !user) {
        return { user: null, error: error?.message || 'Invalid token', supabase: authClient }
    }

    // Token is valid - create admin client for database operations (bypasses RLS)
    // This is secure because we've already verified the user's identity above
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )

    return { user, error: null, supabase: adminClient }
}
