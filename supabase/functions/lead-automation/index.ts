import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { sendWelcomeEmail } from "./emailService.ts";
import { sendWhatsAppMessage } from "./whatsappService.ts";
import { getEmailTemplate, getWhatsAppTemplate } from "./templates.ts";

// ─── CORS Headers ───────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Supabase Admin Client (bypasses RLS) ───────────────────────────────────
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface LeadPayload {
  id: string;
  email: string;
  contact_name: string;
  restaurant_name: string;
  phone: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const lead: LeadPayload = await req.json();

    // Validate required fields
    if (!lead.id || !lead.email || !lead.contact_name || !lead.restaurant_name || !lead.phone) {
      return new Response(
        JSON.stringify({ error: "Missing required lead fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[lead-automation] Processing lead: ${lead.id} — ${lead.restaurant_name}`);

    const results = { email: false, whatsapp: false };
    const now = new Date();
    const timestamp = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // ─── Step 1: Send Welcome Email ───
    try {
      const emailHtml = getEmailTemplate(lead.contact_name, lead.restaurant_name);
      await sendWelcomeEmail(lead.email, lead.contact_name, emailHtml);
      results.email = true;
      console.log(`[lead-automation] ✅ Email sent to ${lead.email}`);
    } catch (err) {
      console.error(`[lead-automation] ❌ Email failed for ${lead.email}:`, err);
    }

    // ─── Step 2: Send WhatsApp Message ───
    try {
      const whatsappText = getWhatsAppTemplate(lead.contact_name, lead.restaurant_name);
      await sendWhatsAppMessage(lead.phone, whatsappText);
      results.whatsapp = true;
      console.log(`[lead-automation] ✅ WhatsApp sent to ${lead.phone}`);
    } catch (err) {
      console.error(`[lead-automation] ❌ WhatsApp failed for ${lead.phone}:`, err);
    }

    // ─── Step 3: Update notes silently ───
    try {
      const emailStatus = results.email ? "✅" : "❌";
      const whatsappStatus = results.whatsapp ? "✅" : "❌";
      const botNote = `[Bot 🤖 ${timestamp}] ${emailStatus} Email de bienvenida | ${whatsappStatus} WhatsApp de primer contacto`;

      const { data: current } = await supabaseAdmin
        .from("demo_requests")
        .select("notes")
        .eq("id", lead.id)
        .single();

      const existingNotes = current?.notes || "";
      const updatedNotes = existingNotes
        ? `${existingNotes}\n${botNote}`
        : botNote;

      const { error: updateError } = await supabaseAdmin
        .from("demo_requests")
        .update({ notes: updatedNotes })
        .eq("id", lead.id);

      if (updateError) {
        console.error(`[lead-automation] ❌ Notes update failed:`, updateError);
      } else {
        console.log(`[lead-automation] ✅ Notes updated for lead ${lead.id}`);
      }
    } catch (err) {
      console.error(`[lead-automation] ❌ Notes update error:`, err);
    }

    return new Response(
      JSON.stringify({ success: true, lead_id: lead.id, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[lead-automation] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
