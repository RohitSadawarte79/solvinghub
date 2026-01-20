import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * POST /api/comments/[id]/replies
 * Create a reply to a comment
 */
export async function POST(request, { params }) {
    try {
        const { id } = params  // comment_id - NOT async

        console.log('POST /api/comments/[id]/replies called with id:', id)

        // Validate UUID format
        if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
            console.log('Invalid comment id received:', id)
            return NextResponse.json(
                { error: 'Invalid comment id' },
                { status: 400 }
            )
        }

        // Dynamic imports to avoid import-time crashes on Vercel
        const { createClient } = await import('@/lib/supabase-server')
        const { replySchema } = await import('@/lib/validation')
        const { sanitizeCommentText } = await import('@/lib/sanitize')

        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
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
            validatedData = replySchema.parse(body)
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

        // Get comment to find problem_id
        const { data: comment, error: commentError } = await supabase
            .from('comments')
            .select('problem_id')
            .eq('id', id)
            .single()

        if (commentError || !comment) {
            return NextResponse.json(
                { error: 'Comment not found' },
                { status: 404 }
            )
        }

        // Sanitize text to prevent XSS attacks (now synchronous)
        const sanitizedText = sanitizeCommentText(text)

        // Insert reply
        const { data, error } = await supabase
            .from('replies')
            .insert({
                comment_id: id,
                problem_id: comment.problem_id,
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
            console.error('Error creating reply:', error)
            return NextResponse.json(
                { error: 'Failed to create reply' },
                { status: 500 }
            )
        }

        return NextResponse.json({ reply: data }, { status: 201 })
    } catch (error) {
        console.error('Unexpected error in POST /api/comments/[id]/replies:', error)
        console.error('Stack trace:', error.stack)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
