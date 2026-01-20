import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
    try {
        // Dynamic import of cookies to avoid issues in different contexts
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
                        } catch (error) {
                            console.error('Error getting cookies:', error)
                            return []
                        }
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch (error) {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                            console.log('Cookie set failed (non-blocking):', error.message)
                        }
                    },
                },
            }
        )
    } catch (error) {
        console.error('Error creating Supabase client:', error)
        // Fallback: create client without cookie handling using basic client
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