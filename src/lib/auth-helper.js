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
            const { data: { user }, error } = await supabase.auth.getUser(token)

            if (error || !user) {
                return { 
                    user: null, 
                    error: error?.message || 'Invalid token', 
                    supabase 
                }
            }

            return { user, error: null, supabase }
        }

        // No token provided - try to get user from session cookies
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return { 
                user: null, 
                error: error?.message || 'No user session', 
                supabase 
            }
        }

        return { user, error: null, supabase }
    } catch (error) {
        console.error('Error in getAuthenticatedUser:', error)
        
        // Return a basic supabase client even on error
        const supabase = await createClient()
        return { 
            user: null, 
            error: error.message, 
            supabase 
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