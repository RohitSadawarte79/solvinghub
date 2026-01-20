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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables in auth-helper')
        return { user: null, error: 'Server configuration error', supabase: null }
    }

    const cookieStore = await cookies()

    // Create client for token validation
    const authClient = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
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

    // Check for service role key (required for admin operations)
    if (!serviceRoleKey) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
        return { user: null, error: 'Server configuration error', supabase: authClient }
    }

    // Token is valid - create admin client for database operations (bypasses RLS)
    // This is secure because we've already verified the user's identity above
    const adminClient = createClient(
        supabaseUrl,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )

    return { user, error: null, supabase: adminClient }
}
