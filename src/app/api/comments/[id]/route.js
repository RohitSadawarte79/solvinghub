import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { replySchema } from '@/lib/validation'
import { sanitizeCommentText } from '@/lib/sanitize'

/**
 * POST /api/comments/[id]/replies
 * Create a reply to a comment
 */
export async function POST(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = params // comment_id

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

        // Sanitize text to prevent XSS attacks
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
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/comments/[id]
 * Delete a comment (and all its replies)
 */
export async function DELETE(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = params

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Verify ownership
        const { data: comment, error: fetchError } = await supabase
            .from('comments')
            .select('user_id')
            .eq('id', id)
            .single()

        if (fetchError || !comment) {
            return NextResponse.json(
                { error: 'Comment not found' },
                { status: 404 }
            )
        }

        if (comment.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden: You can only delete your own comments' },
                { status: 403 }
            )
        }

        // Delete comment (CASCADE will delete replies)
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting comment:', error)
            return NextResponse.json(
                { error: 'Failed to delete comment' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
