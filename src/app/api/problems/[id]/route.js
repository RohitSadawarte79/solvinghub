import { NextResponse } from 'next/server'

// Force Node.js runtime for compatibility
export const runtime = 'nodejs'

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * GET /api/problems/[id]
 * Fetch a single problem by ID with full details
 */
export async function GET(request, { params }) {
    try {
        const { id } = await params

        console.log('GET /api/problems/[id] called with id:', id)

        // Validate UUID format
        if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
            console.log('Invalid problem id received:', id)
            return NextResponse.json(
                { error: 'Invalid problem id' },
                { status: 400 }
            )
        }

        // Dynamic import to avoid import-time crashes on Vercel
        const { createClient } = await import('@/lib/supabase-server')
        const supabase = await createClient()

        // Fetch problem with user details
        const { data, error } = await supabase
            .from('problems')
            .select(`
                *,
                users:user_id (
                    id,
                    display_name,
                    photo_url,
                    reputation
                )
            `)
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Problem not found' },
                    { status: 404 }
                )
            }
            console.error('Error fetching problem:', error)
            return NextResponse.json(
                { error: 'Failed to fetch problem' },
                { status: 500 }
            )
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Problem not found' },
                { status: 404 }
            )
        }

        // Increment view count (fire and forget)
        supabase
            .from('problems')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('id', id)
            .then()

        return NextResponse.json({ problem: data })
    } catch (error) {
        console.error('Unexpected error in GET /api/problems/[id]:', error)
        console.error('Stack trace:', error.stack)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/problems/[id]
 * Update a problem (only by owner)
 */
export async function PATCH(request, { params }) {
    try {
        const { id } = await params

        console.log('PATCH /api/problems/[id] called with id:', id)

        // Validate UUID format
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

        const body = await request.json()
        const { title, description, category, tags, impacts, challenges, status } = body

        // Verify ownership
        const { data: problem, error: fetchError } = await supabase
            .from('problems')
            .select('user_id')
            .eq('id', id)
            .single()

        if (fetchError || !problem) {
            return NextResponse.json(
                { error: 'Problem not found' },
                { status: 404 }
            )
        }

        if (problem.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden: You can only edit your own problems' },
                { status: 403 }
            )
        }

        // Update problem
        const updates = {}
        if (title) updates.title = title
        if (description) updates.description = description
        if (category) updates.category = category
        if (tags) updates.tags = tags
        if (impacts) updates.impacts = impacts
        if (challenges) updates.challenges = challenges
        if (status) updates.status = status

        const { data, error } = await supabase
            .from('problems')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating problem:', error)
            return NextResponse.json(
                { error: 'Failed to update problem' },
                { status: 500 }
            )
        }

        return NextResponse.json({ problem: data })
    } catch (error) {
        console.error('Unexpected error in PATCH /api/problems/[id]:', error)
        console.error('Stack trace:', error.stack)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/problems/[id]
 * Delete a problem (only by owner)
 */
export async function DELETE(request, { params }) {
    try {
        const { id } = await params

        console.log('DELETE /api/problems/[id] called with id:', id)

        // Validate UUID format
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

        // Verify ownership
        const { data: problem, error: fetchError } = await supabase
            .from('problems')
            .select('user_id')
            .eq('id', id)
            .single()

        if (fetchError || !problem) {
            return NextResponse.json(
                { error: 'Problem not found' },
                { status: 404 }
            )
        }

        if (problem.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden: You can only delete your own problems' },
                { status: 403 }
            )
        }

        // Delete problem (CASCADE will delete comments, replies, votes)
        const { error } = await supabase
            .from('problems')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting problem:', error)
            return NextResponse.json(
                { error: 'Failed to delete problem' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unexpected error in DELETE /api/problems/[id]:', error)
        console.error('Stack trace:', error.stack)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
