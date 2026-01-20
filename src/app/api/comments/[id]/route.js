import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * DELETE /api/comments/[id]
 * Delete a comment (and all its replies)
 */
export async function DELETE(request, { params }) {
    try {
        const { id } = params  // NOT async

        console.log('DELETE /api/comments/[id] called with id:', id)

        // Validate UUID format
        if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
            console.log('Invalid comment id received:', id)
            return NextResponse.json(
                { error: 'Invalid comment id' },
                { status: 400 }
            )
        }

        // Dynamic import to avoid import-time crashes on Vercel
        const { createClient } = await import('@/lib/supabase-server')
        const supabase = await createClient()

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
        console.error('Unexpected error in DELETE /api/comments/[id]:', error)
        console.error('Stack trace:', error.stack)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
