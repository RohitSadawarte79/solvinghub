import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth-helper'
import { headers, cookies } from 'next/headers'
import { problemSchema } from '@/lib/validation'
import { sanitizeProblemData } from '@/lib/sanitize'

/**
 * GET /api/problems
 * Fetch problems with CURSOR-BASED pagination (scalable, consistent results)
 * 
 * Query Parameters:
 * - limit (page_size, default: 20)
 * - sort_by (votes|discussions|created_at, default: created_at)
 * - category (filter by category)
 * - status (open|active|has_solutions|solved|archived)
 * - search (full-text search query)
 * - cursor_id (UUID of last item from previous page)
 * - cursor_created_at (timestamp of last item from previous page)
 */
export async function GET(request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)

        // Parse query parameters
        const limit = parseInt(searchParams.get('limit') || '20')
        const sortBy = searchParams.get('sort_by') || 'created_at'
        const category = searchParams.get('category') || null
        const status = searchParams.get('status') || null
        const search = searchParams.get('search') || null
        const cursorId = searchParams.get('cursor_id') || null
        const cursorCreatedAt = searchParams.get('cursor_created_at') || null

        // Try RPC function first, fall back to simple query if it fails
        let data, error

        // Try cursor-based pagination via RPC
        const rpcResult = await supabase.rpc('get_problems_paginated', {
            page_size: limit,
            cursor_id: cursorId,
            cursor_created_at: cursorCreatedAt,
            sort_by: sortBy,
            category_filter: category,
            status_filter: status,
            search_query: search
        })

        if (rpcResult.error) {
            // RPC failed - fall back to simple query
            console.warn('RPC failed, using fallback query:', rpcResult.error.message)

            let query = supabase
                .from('problems')
                .select('*')
                .limit(limit)

            // Apply filters
            if (category) {
                query = query.eq('category', category)
            }
            if (status) {
                query = query.eq('status', status)
            }

            // Apply sorting
            if (sortBy === 'votes') {
                query = query.order('votes', { ascending: false })
            } else if (sortBy === 'discussions') {
                query = query.order('discussions', { ascending: false })
            } else {
                query = query.order('created_at', { ascending: false })
            }

            const fallbackResult = await query
            data = fallbackResult.data
            error = fallbackResult.error
        } else {
            data = rpcResult.data
            error = null
        }

        if (error) {
            console.error('Error fetching problems:', error)
            return NextResponse.json(
                { error: 'Failed to fetch problems' },
                { status: 500 }
            )
        }

        // Extract has_more from the first row (RPC) or estimate from data length (fallback)
        const hasMore = data && data.length > 0 ? (data[0].has_more ?? data.length >= limit) : false

        // Get last item for cursor
        const lastItem = data && data.length > 0 ? data[data.length - 1] : null

        // Return problems with pagination metadata
        return NextResponse.json({
            problems: data || [],
            pagination: {
                has_more: hasMore,
                next_cursor: lastItem ? {
                    cursor_id: lastItem.id,
                    cursor_created_at: lastItem.created_at
                } : null,
                total_returned: data?.length || 0
            },
        })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}


/**
 * POST /api/problems
 * Create a new problem
 * 
 * Body:
 * - title (required)
 * - description (required)
 * - category (required)
 * - tags (array, optional)
 * - impacts (array, optional)
 * - challenges (array, optional)
 */


// ... existing code ...

export async function POST(request) {
    try {
        // Authenticate user
        const { user, error: authError, supabase } = await getAuthenticatedUser(request)

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Parse request body
        const body = await request.json()

        // Validate with Zod schema
        let validatedData
        try {
            validatedData = problemSchema.parse(body)
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

        // Sanitize data
        let sanitizedData
        try {
            sanitizedData = sanitizeProblemData(validatedData)
        } catch (sanitizeError) {
            console.error('Sanitization error:', sanitizeError)
            return NextResponse.json(
                { error: 'Sanitization failed' },
                { status: 500 }
            )
        }

        const { title, description, category, tags, impacts, challenges } = sanitizedData

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single()

        // Create user if needed
        if (!existingUser) {
            const { error: userError } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email,
                    display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    photo_url: user.user_metadata?.avatar_url,
                })

            if (userError) {
                console.error('User creation failed:', userError.message)
            }
        }

        // Insert problem
        const { data, error } = await supabase
            .from('problems')
            .insert({
                title,
                description,
                category,
                tags: tags || [],
                impacts: impacts || [],
                challenges: challenges || [],
                user_id: user.id,
                status: 'open',
            })
            .select()
            .single()

        if (error) {
            console.error('Problem creation failed:', error.message)
            return NextResponse.json(
                { error: 'Failed to create problem' },
                { status: 500 }
            )
        }

        return NextResponse.json({ problem: data }, { status: 201 })
    } catch (error) {
        console.error('POST /api/problems error:', error.message)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
