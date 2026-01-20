import { createClient } from '@/lib/supabase-server'

/**
 * Get the authenticated user from the request.
 * 
 * Flow:
 * 1. Middleware already refreshed tokens for ALL routes (including /api/*)
 * 2. This function reads the fresh session from cookies
 * 3. Returns user if authenticated, null if not
 * 
 * @param {Request} request - The incoming request
 * @returns {Promise<{user: User|null, error: string|null, supabase: SupabaseClient}>}
 */
export async function getAuthenticatedUser(request) {
    let supabase
    
    try {
        supabase = await createClient()
    } catch (clientError) {
        console.error('Failed to create Supabase client:', clientError?.message || clientError)
        throw new Error('Unable to initialize Supabase client')
    }

    // Check for Bearer token in Authorization header (API clients)
    const authHeader = request?.headers?.get?.('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
        try {
            const { data, error } = await supabase.auth.getUser(token)

            if (error) {
                return { user: null, error: error.message, supabase }
            }

            return { user: data?.user || null, error: null, supabase }
        } catch (tokenError) {
            console.error('Token validation exception:', tokenError?.message || tokenError)
            return { user: null, error: 'Token validation failed', supabase }
        }
    }

    // No Bearer token - use session from cookies (browser clients)
    // Middleware has already refreshed the token, so this should work
    try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
            // This is expected for logged-out users
            return { user: null, error: error.message, supabase }
        }

        return { user: data?.user || null, error: null, supabase }
    } catch (sessionError) {
        console.error('Session validation exception:', sessionError?.message || sessionError)
        return { user: null, error: 'Session validation failed', supabase }
    }
}

/**
 * Get current user without requiring authentication.
 * Useful for optional authentication scenarios where you need
 * the user if logged in, but don't want to fail if not.
 * 
 * @returns {Promise<{user: User|null, supabase: SupabaseClient}>}
 */
export async function getCurrentUser() {
    let supabase
    
    try {
        supabase = await createClient()
    } catch (clientError) {
        console.error('Failed to create Supabase client:', clientError?.message || clientError)
        throw new Error('Unable to initialize Supabase client')
    }

    try {
        const { data } = await supabase.auth.getUser()
        return { user: data?.user || null, supabase }
    } catch {
        return { user: null, supabase }
    }
}