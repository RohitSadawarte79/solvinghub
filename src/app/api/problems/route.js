import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/problems
 * List problems with pagination and sorting
 * Public route - no authentication required
 */
export async function GET(request) {
    const startTime = Date.now()
    console.log('[API] GET /api/problems - Request started')
    
    try {
        // Check environment variables first
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error('[API] Missing Supabase environment variables')
            return NextResponse.json(
                { error: 'Server configuration error', details: 'Missing database configuration' },
                { status: 500 }
            )
        }

        // Dynamic import to avoid import-time crashes on Vercel
        let supabase
        try {
            console.log('[API] Creating Supabase client...')
            const { createClient } = await import('@/lib/supabase-server')
            supabase = await createClient()
            console.log('[API] Supabase client created successfully')
        } catch (clientError) {
            console.error('[API] Failed to create Supabase SSR client:', clientError?.message || clientError)
            // Fallback: Create basic anonymous client directly
            try {
                const { createClient: createBasicClient } = await import('@supabase/supabase-js')
                supabase = createBasicClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                    {
                        auth: {
                            persistSession: false,
                            autoRefreshToken: false,
                        }
                    }
                )
                console.log('[API] Fallback anonymous client created')
            } catch (fallbackError) {
                console.error('[API] Failed to create fallback client:', fallbackError?.message || fallbackError)
                return NextResponse.json(
                    { error: 'Database connection failed', details: 'Unable to initialize database client' },
                    { status: 500 }
                )
            }
        }

        // Non-blocking auth check for logging
        try {
            const { data: { user } } = await supabase.auth.getUser()
            console.log('[API] Request by:', user ? `User ${user.id}` : 'Anonymous')
        } catch (authError) {
            // Auth check is optional for public routes - just log and continue
            console.log('[API] Auth check failed (non-blocking):', authError?.message || 'Unknown auth error')
        }

        // Parse query parameters safely
        let limit = 10, offset = 0, sortBy = 'created_at', category = null
        try {
            const { searchParams } = new URL(request.url)
            limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100)
            offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)
            sortBy = searchParams.get('sort_by') || 'created_at'
            category = searchParams.get('category')
            console.log('[API] Query params:', { limit, offset, sortBy, category })
        } catch (parseError) {
            console.error('[API] Error parsing query params:', parseError?.message || parseError)
            // Continue with defaults
        }

        // Build query - simplified for reliability
        console.log('[API] Building Supabase query...')
        let query = supabase
            .from('problems')
            .select('*', { count: 'exact' })

        // Apply category filter if provided
        if (category && category !== 'all') {
            query = query.eq('category', category)
        }

        // Apply sorting
        if (sortBy === 'votes') {
            query = query.order('votes', { ascending: false })
        } else if (sortBy === 'views') {
            query = query.order('view_count', { ascending: false })
        } else {
            query = query.order('created_at', { ascending: false })
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1)

        console.log('[API] Executing Supabase query...')
        const { data, error, count } = await query

        if (error) {
            const duration = Date.now() - startTime
            console.error('[API] Supabase query error:', error?.message || error)
            console.error('[API] Error code:', error?.code)
            console.error('[API] Error details:', error?.details)
            console.error('[API] Request duration:', duration, 'ms')
            return NextResponse.json(
                { 
                    error: 'Failed to fetch problems', 
                    details: error.message || 'Query failed',
                    hint: error.hint || 'Check database connection and RLS policies'
                },
                { status: 500 }
            )
        }

        const duration = Date.now() - startTime
        console.log('[API] Query successful - returned', data?.length || 0, 'problems in', duration, 'ms')

        return NextResponse.json({
            problems: data || [],
            total: count || 0,
            limit,
            offset
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'Content-Type': 'application/json'
            }
        })
    } catch (error) {
        const duration = Date.now() - startTime
        console.error('[API] Unexpected error in GET /api/problems:', error)
        console.error('[API] Error type:', error?.constructor?.name)
        console.error('[API] Error stack:', error?.stack)
        console.error('[API] Request duration:', duration, 'ms')
        
        return NextResponse.json(
            { 
                error: 'Internal server error', 
                details: String(error?.message || error || 'Unknown error'),
                timestamp: new Date().toISOString()
            },
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )
    }
}

/**
 * POST /api/problems
 * Create a new problem
 * Requires authentication
 */
export async function POST(request) {
    const startTime = Date.now()
    console.log('[API] POST /api/problems - Request started')

    try {
        // Check environment variables first
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error('[API] Missing Supabase environment variables')
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            )
        }

        // Parse body first to catch JSON errors early
        let body
        try {
            body = await request.json()
            console.log('[API] Request body parsed successfully')
        } catch (jsonError) {
            console.error('[API] Invalid JSON body:', jsonError?.message || jsonError)
            return NextResponse.json(
                { error: 'Invalid JSON body', details: 'Request body must be valid JSON' },
                { status: 400 }
            )
        }

        // Dynamic imports to avoid import-time crashes on Vercel
        console.log('[API] Loading dependencies...')
        const { getAuthenticatedUser } = await import('@/lib/auth-helper')
        const { problemSchema } = await import('@/lib/validation')
        const { sanitizeTitle, sanitizeProblemDescription } = await import('@/lib/sanitize')

        // Check authentication
        console.log('[API] Checking authentication...')
        const { user, error: authError, supabase } = await getAuthenticatedUser(request)
        if (authError || !user) {
            const duration = Date.now() - startTime
            console.log('[API] Authentication failed:', authError || 'No user', 'duration:', duration, 'ms')
            return NextResponse.json(
                { error: 'Unauthorized', details: 'You must be logged in to create a problem' },
                { status: 401 }
            )
        }

        console.log('[API] User authenticated:', user.id)

        // Validate with Zod schema
        let validatedData
        try {
            console.log('[API] Validating request data...')
            validatedData = problemSchema.parse(body)
        } catch (validationError) {
            const duration = Date.now() - startTime
            console.error('[API] Validation failed:', validationError?.message || validationError)
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationError.errors?.map(e => ({
                        field: e.path?.join('.') || 'unknown',
                        message: e.message
                    })) || []
                },
                { status: 400 }
            )
        }

        const { title, description, category, tags, impacts, challenges } = validatedData

        // Sanitize inputs
        console.log('[API] Sanitizing inputs...')
        const sanitizedTitle = sanitizeTitle(title)
        const sanitizedDescription = sanitizeProblemDescription(description)

        // Insert problem
        console.log('[API] Inserting problem into database...')
        const { data, error } = await supabase
            .from('problems')
            .insert({
                title: sanitizedTitle,
                description: sanitizedDescription,
                category,
                tags: tags || [],
                impacts: impacts || [],
                challenges: challenges || [],
                user_id: user.id,
                status: 'open',
                votes: 0,
                discussions: 0,
                view_count: 0
            })
            .select(`
                *,
                users:user_id (
                    id,
                    display_name,
                    photo_url,
                    reputation
                )
            `)
            .single()

        if (error) {
            const duration = Date.now() - startTime
            console.error('[API] Error creating problem:', error?.message || error)
            console.error('[API] Error code:', error?.code)
            console.error('[API] Error details:', error?.details)
            console.error('[API] Request duration:', duration, 'ms')
            return NextResponse.json(
                { error: 'Failed to create problem', details: error.message || 'Database insert failed' },
                { status: 500 }
            )
        }

        const duration = Date.now() - startTime
        console.log('[API] Problem created successfully in', duration, 'ms')
        return NextResponse.json({ problem: data }, { status: 201 })
    } catch (error) {
        const duration = Date.now() - startTime
        console.error('[API] Unexpected error in POST /api/problems:', error)
        console.error('[API] Error type:', error?.constructor?.name)
        console.error('[API] Error stack:', error?.stack)
        console.error('[API] Request duration:', duration, 'ms')
        
        return NextResponse.json(
            { 
                error: 'Internal server error', 
                details: error?.message || 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        )
    }
}