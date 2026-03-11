/**
 * WhatsApp Service — Custom Render Bot (whatsapp-web.js)
 */

export async function sendWhatsAppMessage(
  phoneNumber: string,
  messageText: string
): Promise<void> {
  const botUrl = Deno.env.get("WHATSAPP_BOT_URL");

  if (!botUrl) {
    console.warn("[whatsappService] WHATSAPP_BOT_URL no configurada. Saltando envío (dry-run).");
    console.log(`[whatsappService] 💬 DRY-RUN: Simulación de WhatsApp a ${phoneNumber}`);
    return;
  }

  // Limpiamos el número de teléfono para asegurar el formato que usualmente esperan los bots
  // (Elimina espacios, signos +, paréntesis y guiones)
  const cleanPhone = phoneNumber.replace(/[\s\-()+]/g, "");

  try {
    const response = await fetch(botUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        telefono: cleanPhone,
        mensaje: messageText,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[whatsappService] ❌ Respuesta fallida del bot de Render (${response.status}): ${errorBody}`);
      // Lanzamos el error para que index.ts lo atrape y registre el ❌ en las notas de la DB
      throw new Error(`Bot HTTP error: ${response.status}`);
    }

    console.log(`[whatsappService] ✅ WhatsApp enviado a ${cleanPhone} vía bot de Render`);
  } catch (error) {
    // Si fetch falla por red caída, timeout, DNS, etc.
    console.error(`[whatsappService] ❌ Error conectando al bot de WhatsApp en Render:`, error);
    // Relanzar el error mantiene la lógica de bitácora intacta en index.ts (lo marcará como ❌)
    throw error;
  }
}
