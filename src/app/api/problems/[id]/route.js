import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth-helper'

// Force Node.js runtime for compatibility with dependencies
export const runtime = 'nodejs'

/**
 * GET /api/problems/[id]
 * Fetch a single problem by ID with full details
 */
export async function GET(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = params

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

        // Increment view count (fire and forget)
        supabase
            .from('problems')
            .update({ view_count: data.view_count + 1 })
            .eq('id', id)
            .then()

        return NextResponse.json({ problem: data })
    } catch (error) {
        console.error('Unexpected error:', error)
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
        console.error('Unexpected error:', error)
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
        const { id } = params

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
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
