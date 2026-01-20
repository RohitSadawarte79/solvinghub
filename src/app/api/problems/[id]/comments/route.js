import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * GET /api/problems/[id]/comments
 * Fetch all comments for a problem with nested replies
 */
export async function GET(request, { params }) {
    try {
        const { id } = params

        console.log('GET /api/problems/[id]/comments - Handler entered:', request.method, 'id:', id)

        // Validate UUID format BEFORE any database operation
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

        // Fetch comments with user details and reply count
        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
        *,
        users:user_id (
          id,
          display_name,
          photo_url
        )
      `)
            .eq('problem_id', id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching comments:', error)
            return NextResponse.json(
                { error: 'Failed to fetch comments' },
                { status: 500 }
            )
        }

        // Fetch all replies for these comments
        const commentIds = comments.map(c => c.id)

        if (commentIds.length > 0) {
            const { data: replies } = await supabase
                .from('replies')
                .select(`
          *,
          users:user_id (
            id,
            display_name,
            photo_url
          )
        `)
                .in('comment_id', commentIds)
                .order('created_at', { ascending: true })

            // Group replies by comment_id
            const repliesByComment = {}
            if (replies) {
                replies.forEach(reply => {
                    if (!repliesByComment[reply.comment_id]) {
                        repliesByComment[reply.comment_id] = []
                    }
                    repliesByComment[reply.comment_id].push(reply)
                })
            }

            // Attach replies to comments
            comments.forEach(comment => {
                comment.replies = repliesByComment[comment.id] || []
            })
        } else {
            comments.forEach(comment => {
                comment.replies = []
            })
        }

        return NextResponse.json({ comments })
    } catch (error) {
        console.error('Unexpected error in GET /api/problems/[id]/comments:', error)
        console.error('Stack trace:', error.stack)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/problems/[id]/comments
 * Create a new comment on a problem
 */
export async function POST(request, { params }) {
    try {
        const { id } = params

        console.log('POST /api/problems/[id]/comments - Handler entered:', request.method, 'id:', id)

        // Validate UUID format BEFORE any database operation
        if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
            console.log('Invalid problem id received:', id)
            return NextResponse.json(
                { error: 'Invalid problem id' },
                { status: 400 }
            )
        }

        // Dynamic imports to avoid import-time crashes on Vercel
        const { getAuthenticatedUser } = await import('@/lib/auth-helper')
        const { commentSchema } = await import('@/lib/validation')
        const { sanitizeCommentText } = await import('@/lib/sanitize')

        // Check authentication using token from Authorization header
        const { user, error: authError, supabase } = await getAuthenticatedUser(request)
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate with Zod schema
        let validatedData
        try {
            validatedData = commentSchema.parse(body)
        } catch (error) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                },
                { status: 400 }
            )
        }

        const { text } = validatedData

        // Sanitize text to prevent XSS attacks (now synchronous)
        const sanitizedText = sanitizeCommentText(text)

        // Insert comment
        const { data, error } = await supabase
            .from('comments')
            .insert({
                problem_id: id,
                user_id: user.id,
                text: sanitizedText,
            })
            .select(`
        *,
        users:user_id (
          id,
          display_name,
          photo_url
        )
      `)
            .single()

        if (error) {
            console.error('Error creating comment:', error)
            return NextResponse.json(
                { error: 'Failed to create comment' },
                { status: 500 }
            )
        }

        // Add empty replies array
        data.replies = []

        return NextResponse.json({ comment: data }, { status: 201 })
    } catch (error) {
        console.error('Unexpected error in POST /api/problems/[id]/comments:', error)
        console.error('Stack trace:', error.stack)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
