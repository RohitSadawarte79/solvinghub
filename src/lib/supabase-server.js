import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for server-side operations.
 * Uses cookies from next/headers for session management.
 * 
 * IMPORTANT: Middleware now refreshes tokens for ALL routes including /api/*
 * This ensures tokens are fresh when this client reads them.
 * 
 * This function implements multiple fallback strategies to ensure it always
 * returns a working client, even if cookie handling fails.
 */
export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Fail fast if env vars are missing
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[supabase-server] Missing Supabase environment variables')
        console.error('[supabase-server] NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
        console.error('[supabase-server] NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey)
        throw new Error('Missing Supabase environment variables')
    }

    try {
        // Dynamic import of cookies to avoid issues in different contexts
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()

        console.log('[supabase-server] Creating SSR client with cookie handling')
        return createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        try {
                            const allCookies = cookieStore.getAll()
                            console.log('[supabase-server] Retrieved', allCookies?.length || 0, 'cookies')
                            return allCookies
                        } catch (error) {
                            console.error('[supabase-server] Error getting cookies:', error?.message || error)
                            return []
                        }
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch (error) {
                            // Cookie set fails in Server Components - this is expected
                            // Middleware handles token refresh, so this is non-blocking
                            console.log('[supabase-server] Cookie set failed (expected in Server Components)')
                        }
                    },
                },
            }
        )
    } catch (error) {
        // Log the actual error for debugging
        console.error('[supabase-server] Error creating Supabase SSR client:', String(error?.message || error))
        console.log('[supabase-server] Falling back to anonymous client')
        
        // Return anonymous client - user will appear logged out
        // This is safer than throwing and causing 500 errors
        return createSupabaseClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
            }
        )
    }
}

// Alternative: Simple read-only client for API routes
export async function createClientForApiRoute() {
    try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()

        return createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        try {
                            return cookieStore.getAll()
                        } catch {
                            return []
                        }
                    },
                    setAll() {
                        // Do nothing - API routes are read-only for cookies
                    },
                },
            }
        )
    } catch (error) {
        console.error('Error creating API route client:', error)
        // Fallback to basic client
        return createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
            }
        )
    }
}

// Admin client for server-side operations that need to bypass RLS
// USE WITH CAUTION - Only for trusted server-side operations
export async function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing Supabase admin environment variables')
        throw new Error('Server configuration error: Missing Supabase admin credentials')
    }

    return createSupabaseClient(
        supabaseUrl,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}