import { createClient } from '@/lib/supabase-server'

/**
 * Extract and validate the user from the Authorization header
 * Returns the authenticated Supabase client with user context
 * 
 * @param {Request} request - The incoming request
 * @returns {Promise<{user: User|null, error: string|null, supabase: SupabaseClient}>}
 */
export async function getAuthenticatedUser(request) {
    try {
        // Create server client (this respects RLS and user context)
        const supabase = await createClient()

        // Extract Authorization header if provided
        const authHeader = request.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (token) {
            // Validate the token with Supabase
            try {
                const { data: { user }, error } = await supabase.auth.getUser(token)

                if (error) {
                    console.error('Token validation error:', error.message)
                    return { 
                        user: null, 
                        error: error.message, 
                        supabase 
                    }
                }

                if (!user) {
                    return { 
                        user: null, 
                        error: 'Invalid token - no user found', 
                        supabase 
                    }
                }

                return { user, error: null, supabase }
            } catch (tokenError) {
                console.error('Exception during token validation:', tokenError)
                return { 
                    user: null, 
                    error: tokenError.message, 
                    supabase 
                }
            }
        }

        // No token provided - try to get user from session cookies
        try {
            const { data: { user }, error } = await supabase.auth.getUser()

            if (error) {
                console.log('Session validation error (non-critical):', error.message)
                return { 
                    user: null, 
                    error: error.message, 
                    supabase 
                }
            }

            if (!user) {
                return { 
                    user: null, 
                    error: 'No user session', 
                    supabase 
                }
            }

            return { user, error: null, supabase }
        } catch (sessionError) {
            console.error('Exception during session validation:', sessionError)
            return { 
                user: null, 
                error: sessionError.message, 
                supabase 
            }
        }
    } catch (error) {
        console.error('Fatal error in getAuthenticatedUser:', error)
        
        // Return a basic supabase client even on fatal error
        try {
            const supabase = await createClient()
            return { 
                user: null, 
                error: error.message, 
                supabase 
            }
        } catch (fallbackError) {
            // This should never happen, but handle it gracefully
            console.error('Failed to create fallback client:', fallbackError)
            throw new Error('Unable to initialize Supabase client')
        }
    }
}

/**
 * Get current user without requiring authentication
 * Useful for optional authentication scenarios
 * 
 * @returns {Promise<{user: User|null, supabase: SupabaseClient}>}
 */
export async function getCurrentUser() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        return { user, supabase }
    } catch (error) {
        console.error('Error getting current user:', error)
        const supabase = await createClient()
        return { user: null, supabase }
    }
}