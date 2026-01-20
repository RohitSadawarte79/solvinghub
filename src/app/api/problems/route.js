import { NextResponse } from 'next/server'

// Force Node.js runtime for compatibility
export const runtime = 'nodejs'

/**
 * MINIMAL DEBUG HANDLER - Phase 1
 * GET /api/problems - List problems
 * 
 * Purpose: Isolate the exact failure point on Vercel serverless
 */
export async function GET(request) {
    const logs = []

    try {
        // Step 1: Entry point
        logs.push('[1] GET /api/problems - Handler entered')

        // Step 2: Check environment variables
        const envCheck = {
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
        logs.push(`[2] Env vars check: ${JSON.stringify(envCheck)}`)

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            logs.push('[2.1] FAIL: Missing Supabase environment variables')
            console.log('[DEBUG]', logs.join('\n'))
            return NextResponse.json({
                error: 'Missing Supabase environment variables',
                debug: logs
            }, { status: 500 })
        }

        // Step 3: Dynamically import supabase-server
        logs.push('[3] Attempting to dynamically import @/lib/supabase-server...')
        console.log('[DEBUG] [3] Attempting to dynamically import @/lib/supabase-server...')

        let createClient
        try {
            const supabaseModule = await import('@/lib/supabase-server')
            createClient = supabaseModule.createClient
            logs.push('[3.1] SUCCESS: supabase-server imported')
            console.log('[DEBUG] [3.1] SUCCESS: supabase-server imported')
        } catch (importError) {
            logs.push(`[3.1] FAIL: supabase-server import error: ${importError.message}`)
            logs.push(`[3.2] Stack: ${importError.stack}`)
            console.error('[DEBUG] Import error:', importError)
            return NextResponse.json({
                error: 'Failed to import supabase-server',
                message: importError.message,
                debug: logs
            }, { status: 500 })
        }

        // Step 4: Create Supabase client
        logs.push('[4] Creating Supabase client...')
        console.log('[DEBUG] [4] Creating Supabase client...')

        let supabase
        try {
            supabase = await createClient()
            logs.push('[4.1] SUCCESS: Supabase client created')
            console.log('[DEBUG] [4.1] SUCCESS: Supabase client created')
        } catch (clientError) {
            logs.push(`[4.1] FAIL: Supabase client creation error: ${clientError.message}`)
            logs.push(`[4.2] Stack: ${clientError.stack}`)
            console.error('[DEBUG] Client creation error:', clientError)
            return NextResponse.json({
                error: 'Failed to create Supabase client',
                message: clientError.message,
                debug: logs
            }, { status: 500 })
        }

        // Step 5: Query start
        logs.push('[5] Starting Supabase query for problems...')
        console.log('[DEBUG] [5] Starting Supabase query for problems...')

        const { data, error } = await supabase
            .from('problems')
            .select('id, title, created_at')
            .order('created_at', { ascending: false })
            .limit(5)

        // Step 6: Query end
        logs.push(`[6] Query complete. Error: ${error ? error.message : 'none'}, Data count: ${data?.length ?? 0}`)
        console.log('[DEBUG] [6] Query complete. Error:', error?.message ?? 'none', 'Data count:', data?.length ?? 0)

        if (error) {
            return NextResponse.json({
                error: 'Supabase query failed',
                message: error.message,
                debug: logs
            }, { status: 500 })
        }

        // Step 7: Return success
        logs.push('[7] SUCCESS: Returning JSON response')
        console.log('[DEBUG] [7] SUCCESS: Returning JSON response')
        console.log('[DEBUG] Full logs:', logs.join(' | '))

        return NextResponse.json({
            success: true,
            problems: data,
            debug: logs
        })

    } catch (error) {
        logs.push(`[FATAL] Unexpected error: ${error.message}`)
        logs.push(`[FATAL] Stack: ${error.stack}`)
        console.error('[DEBUG] [FATAL] Unexpected error:', error)

        return NextResponse.json({
            error: 'Internal server error',
            message: error.message,
            stack: error.stack,
            debug: logs
        }, { status: 500 })
    }
}
