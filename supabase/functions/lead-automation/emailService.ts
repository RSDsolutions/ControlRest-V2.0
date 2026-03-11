/**
 * Email Service — Resend (https://resend.com)
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendWelcomeEmail(
  to: string,
  contactName: string,
  htmlBody: string
): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "RestoGestión <soporte@restogestion.site>";

  if (!apiKey) {
    console.warn("[emailService] RESEND_API_KEY not configured. Skipping email send (dry-run).");
    console.log(`[emailService] 📧 DRY-RUN: Would send email to ${to}`);
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: `¡Bienvenido a RestoGestión, ${contactName}! 🍽️`,
      html: htmlBody,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }

  console.log(`[emailService] ✅ Email sent successfully to ${to}`);
}

export async function sendAdminNotificationEmail(
  contactName: string,
  htmlBody: string
): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "RestoGestión <soporte@restogestion.site>";

  if (!apiKey) {
    console.warn("[emailService] RESEND_API_KEY not configured. Skipping admin notification.");
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: ["robinsonsolorzano99@gmail.com"],
      subject: `🚀 Nuevo Lead Registrado: ${contactName}`,
      html: htmlBody,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend Admin API error (${response.status}): ${errorBody}`);
  }

  console.log(`[emailService] ✅ Admin notification email sent successfully`);
}
