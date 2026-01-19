import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        // Only set on response cookies (request cookies are read-only in middleware)
                        cookiesToSet.forEach(({ name, value, options }) => {
                            supabaseResponse.cookies.set(name, value, options)
                        })
                    } catch (error) {
                        // Session refresh failures should be non-fatal
                        // User will be prompted to re-login on next auth check
                        console.error('Failed to set auth cookies:', error)
                    }
                },
            },
        }
    )

    // Refresh session if expired - required for Server Components
    // This will also update the cookies
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // console.log('Middleware: User authenticated:', !!user)

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
