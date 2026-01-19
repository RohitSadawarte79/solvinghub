// Supabase Edge Function for auto-archiving stale problems
// Deploy this to Supabase as an Edge Function with cron trigger

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STALE_THRESHOLD_DAYS = 90 // Archive problems inactive for 90+ days

Deno.serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        )

        // Calculate threshold date
        const thresholdDate = new Date()
        thresholdDate.setDate(thresholdDate.getDate() - STALE_THRESHOLD_DAYS)

        // Find stale problems to archive
        // Criteria:
        // 1. Status is 'open' or 'active' (not already solved/archived)
        // 2. Last activity > 90 days ago
        // 3. No accepted solutions
        const { data: staleProblems, error: fetchError } = await supabase
            .from('problems')
            .select('id, title, last_activity_at')
            .in('status', ['open', 'active'])
            .lt('last_activity_at', thresholdDate.toISOString())

        if (fetchError) {
            console.error('Error fetching stale problems:', fetchError)
            return new Response(
                JSON.stringify({ error: 'Failed to fetch stale problems' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        if (!staleProblems || staleProblems.length === 0) {
            return new Response(
                JSON.stringify({
                    message: 'No stale problems found',
                    archived_count: 0,
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // Archive stale problems
        const problemIds = staleProblems.map(p => p.id)

        const { error: updateError } = await supabase
            .from('problems')
            .update({
                status: 'archived',
                archived_at: new Date().toISOString(),
            })
            .in('id', problemIds)

        if (updateError) {
            console.error('Error archiving problems:', updateError)
            return new Response(
                JSON.stringify({ error: 'Failed to archive problems' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Successfully archived ${problemIds.length} stale problems`)
        console.log('Archived problem IDs:', problemIds)

        return new Response(
            JSON.stringify({
                message: 'Successfully archived stale problems',
                archived_count: problemIds.length,
                problem_ids: problemIds,
                threshold_date: thresholdDate.toISOString(),
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})

/* 
To deploy this Edge Function:

1. Install Supabase CLI:
   npm install -g supabase

2. Login to Supabase:
   supabase login

3. Link your project:
   supabase link --project-ref your-project-ref

4. Deploy the function:
   supabase functions deploy auto-archive-problems

5. Set up cron trigger in Supabase Dashboard:
   - Go to Database → Cron Jobs
   - Schedule: 0 2 * * * (daily at 2 AM)
   - HTTP request: POST https://your-project.supabase.co/functions/v1/auto-archive-problems
   - Headers: { "Authorization": "Bearer YOUR_ANON_KEY" }

6. Monitor logs:
   supabase functions log auto-archive-problems
*/
