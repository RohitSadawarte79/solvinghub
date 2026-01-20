export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET(req) {
    console.log("=== /api/problems HIT ===");

    try {
        console.log("Step 1: Handler entered");

        console.log("Step 2: Env check", {
            url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        });

        console.log("Step 3: Importing supabase client");

        const { createClient } = await import("@supabase/supabase-js");

        console.log("Step 4: Creating client");

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        console.log("Step 5: Running query");

        const { data, error } = await supabase
            .from("problems")
            .select("*")
            .limit(1);

        console.log("Step 6: Query finished", { hasData: !!data, error });

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("Step 7: Returning response");

        return NextResponse.json({ ok: true, data });

    } catch (e) {
        console.error("=== API CRASHED ===");
        console.error(e);
        return NextResponse.json(
            { error: e.message, stack: e.stack },
            { status: 500 }
        );
    }
}
