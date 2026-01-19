import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helper'

/**
 * POST /api/problems/[id]/vote
 * Toggle vote on a problem (upvote if not voted, remove if already voted)
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
        console.error('Unexpected error:', error)
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
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
