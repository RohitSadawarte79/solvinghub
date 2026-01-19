import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create client only if env vars are available (handles build-time static generation)
const createSupabaseClient = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        // During build time, env vars may not be available
        // Return a mock client that throws helpful errors at runtime
        if (typeof window === 'undefined') {
            console.warn('Supabase env vars not available during build - this is expected for static generation')
        }
        return null
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    })
}

export const supabase = createSupabaseClient()

// Helper to ensure supabase client is available
const ensureClient = () => {
    if (!supabase) {
        throw new Error('Supabase client not initialized. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }
    return supabase
}

// Helper function to get current user
export const getCurrentUser = async () => {
    const client = ensureClient()
    const { data: { user }, error } = await client.auth.getUser()
    if (error) throw error
    return user
}

// Helper function to sign in with Google
export const signInWithGoogle = async () => {
    const client = ensureClient()
    const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    })
    if (error) throw error
    return data
}

// Helper function to sign out
export const signOut = async () => {
    const client = ensureClient()
    const { error } = await client.auth.signOut()
    if (error) throw error
}

// Helper to check if user is authenticated
export const isAuthenticated = async () => {
    const client = ensureClient()
    const { data: { session } } = await client.auth.getSession()
    return !!session
}

