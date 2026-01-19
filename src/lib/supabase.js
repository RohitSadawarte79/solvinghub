import { createClient } from '@supabase/supabase-js'

// Lazy-initialized supabase client
let supabaseInstance = null

// Get or create supabase client (lazy initialization for build compatibility)
const getSupabaseClient = () => {
    if (supabaseInstance) {
        return supabaseInstance
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        // During build time or if env vars missing
        if (typeof window === 'undefined') {
            // Server-side during build - don't throw, just warn
            console.warn('Supabase env vars not available - client will be created at runtime')
            return null
        }
        // Client-side without env vars - this is a real error
        throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
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

    return supabaseInstance
}

// Export a proxy that lazy-initializes the client
export const supabase = new Proxy({}, {
    get(target, prop) {
        const client = getSupabaseClient()
        if (!client) {
            // Return a mock for build-time that won't crash
            if (prop === 'auth') {
                return {
                    getUser: async () => ({ data: { user: null }, error: null }),
                    getSession: async () => ({ data: { session: null }, error: null }),
                    signInWithOAuth: async () => ({ data: null, error: new Error('Client not initialized') }),
                    signOut: async () => ({ error: null }),
                    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                }
            }
            return () => Promise.resolve({ data: null, error: new Error('Client not initialized') })
        }
        return client[prop]
    }
})

// Helper function to get current user
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
}

// Helper function to sign in with Google
export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
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
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

// Helper to check if user is authenticated
export const isAuthenticated = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
}
