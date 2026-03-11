/**
 * Lead Automation Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fire-and-forget service that triggers the `lead-automation` Supabase Edge
 * Function after a new lead is successfully inserted into `demo_requests`.
 *
 * This module is intentionally decoupled from the form submission flow.
 * It NEVER blocks the main thread and silently captures all errors.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface LeadAutomationPayload {
    id: string;
    email: string;
    contact_name: string;
    restaurant_name: string;
    phone: string;
}

/**
 * Triggers the lead automation Edge Function.
 * This is a FIRE-AND-FORGET call — it does NOT return a promise
 * and will never throw or block the calling code.
 */
export function triggerLeadAutomation(lead: LeadAutomationPayload): void {
    // Guard: ensure we have the necessary config
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('[leadAutomation] Missing Supabase env vars. Skipping automation.');
        return;
    }

    const url = `${SUPABASE_URL}/functions/v1/lead-automation`;

    // Fire-and-forget: no await, no blocking
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(lead),
    })
        .then((res) => {
            if (!res.ok) {
                console.error(`[leadAutomation] Edge Function returned ${res.status}`);
            } else {
                console.log('[leadAutomation] ✅ Automation triggered successfully');
            }
        })
        .catch((err) => {
            // Silent catch — never propagate errors to the UI
            console.error('[leadAutomation] Failed to trigger automation:', err);
        });
}
