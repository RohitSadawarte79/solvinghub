import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * POST /api/problems/[id]/vote
 * Toggle vote on a problem (upvote if not voted, remove if already voted)
 */
export async function POST(request, { params }) {
    try {
        const { id } = params

        console.log('POST /api/problems/[id]/vote - Handler entered:', request.method, 'id:', id)

        // Validate UUID format BEFORE any database operation
        if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
            console.log('Invalid problem id received:', id)
            return NextResponse.json(
                { error: 'Invalid problem id' },
                { status: 400 }
            )
        }

        // Dynamic import to avoid import-time crashes on Vercel
        const { getAuthenticatedUser } = await import('@/lib/auth-helper')

        // Check authentication using token from Authorization header
        const { user, error: authError, supabase } = await getAuthenticatedUser(request)
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user already voted
        const { data: existingVote } = await supabase
            .from('problem_votes')
            .select('id')
            .eq('user_id', user.id)
            .eq('problem_id', id)
            .single()

        if (existingVote) {
            // Remove vote
            const { error } = await supabase
                .from('problem_votes')
                .delete()
                .eq('id', existingVote.id)

            if (error) {
                console.error('Error removing vote:', error)
                return NextResponse.json(
                    { error: 'Failed to remove vote' },
                    { status: 500 }
                )
            }

            // Get updated vote count
            const { data: problem } = await supabase
                .from('problems')
                .select('votes')
                .eq('id', id)
                .single()

            return NextResponse.json({
                voted: false,
                votes: problem?.votes || 0,
            })
        } else {
            // Add vote
            const { error } = await supabase
                .from('problem_votes')
                .insert({
                    user_id: user.id,
                    problem_id: id,
                })

            if (error) {
                console.error('Error adding vote:', error)
                return NextResponse.json(
                    { error: 'Failed to add vote' },
                    { status: 500 }
                )
            }

            // Get updated vote count
            const { data: problem } = await supabase
                .from('problems')
                .select('votes')
                .eq('id', id)
                .single()

            return NextResponse.json({
                voted: true,
                votes: problem?.votes || 0,
            })
        }
    } catch (error) {
        console.error('Unexpected error in POST /api/problems/[id]/vote:', error)
        console.error('Stack trace:', error.stack)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/problems/[id]/vote
 * Check if current user has voted on this problem
 */
export async function GET(request, { params }) {
    try {
        const { id } = params

        console.log('GET /api/problems/[id]/vote - Handler entered:', request.method, 'id:', id)

        // Validate UUID format BEFORE any database operation
        if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
            console.log('Invalid problem id received:', id)
            return NextResponse.json(
                { error: 'Invalid problem id' },
                { status: 400 }
            )
        }

        // Dynamic import to avoid import-time crashes on Vercel
        const { getAuthenticatedUser } = await import('@/lib/auth-helper')

        // Check authentication using token from Authorization header
        const { user, supabase } = await getAuthenticatedUser(request)
        if (!user) {
            return NextResponse.json({ voted: false })
        }

        // Check if user has voted
        const { data } = await supabase
            .from('problem_votes')
            .select('id')
            .eq('user_id', user.id)
            .eq('problem_id', id)
            .single()

        return NextResponse.json({ voted: !!data })
    } catch (error) {
        console.error('Unexpected error in GET /api/problems/[id]/vote:', error)
        console.error('Stack trace:', error.stack)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
