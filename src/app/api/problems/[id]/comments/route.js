import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth-helper'
import { commentSchema } from '@/lib/validation'
import { sanitizeCommentText } from '@/lib/sanitize'

/**
 * GET /api/problems/[id]/comments
 * Fetch all comments for a problem with nested replies
 */
export async function GET(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = params

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
        console.error('Unexpected error:', error)
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

        // Sanitize text to prevent XSS attacks
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
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
