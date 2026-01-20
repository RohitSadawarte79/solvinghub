import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/problems
 * List problems with pagination and sorting
 */
export async function GET(request) {
    try {
        // Dynamic import to avoid import-time crashes on Vercel
        let supabase
        try {
            const { createClient } = await import('@/lib/supabase-server')
            supabase = await createClient()
        } catch (clientError) {
            console.error('Failed to create Supabase client:', clientError)
            // Fallback: Create basic client directly
            const { createClient: createBasicClient } = await import('@supabase/supabase-js')
            supabase = createBasicClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            )
        }

        // Parse query parameters safely
        let limit = 10, offset = 0, sortBy = 'created_at', category = null
        try {
            const { searchParams } = new URL(request.url)
            limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100)
            offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)
            sortBy = searchParams.get('sort_by') || 'created_at'
            category = searchParams.get('category')
        } catch (parseError) {
            console.error('Error parsing query params:', parseError)
        }

        // Build query - simplified for reliability
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

        const { data, error, count } = await query

        if (error) {
            console.error('Supabase query error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch problems', details: error.message || 'Query failed' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            problems: data || [],
            total: count || 0,
            limit,
            offset
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        })
    } catch (error) {
        console.error('API route error:', error)
        return NextResponse.json(
            { 
                error: 'Internal server error', 
                details: String(error?.message || error || 'Unknown error')
            },
            { status: 500 }
        )
    }
}

/**
 * POST /api/problems
 * Create a new problem
 */
export async function POST(request) {
    try {
        console.log('POST /api/problems - Handler entered')

        // Parse body first to catch JSON errors early
        let body
        try {
            body = await request.json()
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400 }
            )
        }

        // Dynamic imports to avoid import-time crashes on Vercel
        const { getAuthenticatedUser } = await import('@/lib/auth-helper')
        const { problemSchema } = await import('@/lib/validation')
        const { sanitizeTitle, sanitizeProblemDescription } = await import('@/lib/sanitize')

        // Check authentication
        const { user, error: authError, supabase } = await getAuthenticatedUser(request)
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Validate with Zod schema
        let validatedData
        try {
            validatedData = problemSchema.parse(body)
        } catch (error) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: error.errors?.map(e => ({
                        field: e.path?.join('.') || 'unknown',
                        message: e.message
                    })) || []
                },
                { status: 400 }
            )
        }

        const { title, description, category, tags, impacts, challenges } = validatedData

        // Sanitize inputs
        const sanitizedTitle = sanitizeTitle(title)
        const sanitizedDescription = sanitizeProblemDescription(description)

        // Insert problem
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
            console.error('Error creating problem:', error)
            return NextResponse.json(
                { error: 'Failed to create problem', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ problem: data }, { status: 201 })
    } catch (error) {
        console.error('Unexpected error in POST /api/problems:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}