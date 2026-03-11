/**
 * Templates for automated lead communications.
 */

// ─── Email HTML Template ───
export function getEmailTemplate(contactName: string, restaurantName: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0B1120;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0;letter-spacing:-0.5px;">
        RESTOGESTIÓN
      </h1>
      <div style="width:60px;height:3px;background:linear-gradient(90deg,#2563eb,#3b82f6);margin:12px auto 0;"></div>
    </div>

    <!-- Main Card -->
    <div style="background-color:#1e293b;border:1px solid #334155;border-radius:24px;padding:40px 32px;">
      <h2 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 20px;">
        Hola ${contactName}, ¿cómo estás?
      </h2>
      <p style="color:#cbd5e1;font-size:15px;line-height:1.8;margin:0 0 16px;">
        Soy Robinson de <strong style="color:#ffffff;">RestoGestión</strong>.<br>
        Gracias por solicitar una demo para <strong style="color:#3b82f6;">${restaurantName}</strong>.
      </p>

      <p style="color:#cbd5e1;font-size:15px;line-height:1.8;margin:0 0 24px;">
        Para que puedas ver el sistema funcionando de forma real durante la demostración, vamos a crear <strong style="color:#ffffff;">tu cuenta de administrador dentro de la plataforma</strong>.
      </p>

      <!-- Info Box -->
      <div style="background-color:#0f172a;border:1px solid #1e3a5f;border-radius:16px;padding:24px;margin-bottom:24px;">
        <h3 style="color:#3b82f6;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">
          ¿Podrías confirmarme estos datos?
        </h3>
        <div style="color:#cbd5e1;font-size:14px;line-height:2.2;">
          • Nombre del administrador<br>
          • Correo electrónico (será tu usuario de acceso)<br>
          • Nombre del restaurante o negocio<br>
          • Ciudad<br>
          • Número aproximado de sucursales
        </div>
      </div>

      <p style="color:#cbd5e1;font-size:15px;line-height:1.8;margin:0 0 16px;">
        Con esta información prepararé tu sistema para que puedas probarlo antes de la demo.
      </p>

      <p style="color:#cbd5e1;font-size:15px;line-height:1.8;margin:0 0 24px;">
        Una vez creada tu cuenta, te enviaré <strong style="color:#ffffff;">tus credenciales de acceso y una guía rápida de inicio</strong> para que puedas explorar la plataforma.
      </p>

      <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0;">
        Quedo atento 👍
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="color:#475569;font-size:12px;margin:0;">
        © ${new Date().getFullYear()} RestoGestión — Gestión Inteligente de Restaurantes
      </p>
      <p style="color:#334155;font-size:11px;margin:8px 0 0;">
        restogestion.site
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ─── WhatsApp Text Template ───
export function getWhatsAppTemplate(contactName: string, restaurantName: string): string {
  return [
    `Hola ${contactName}, ¿cómo estás?`,
    ``,
    `Soy Robinson de *RestoGestión*.`,
    `Gracias por solicitar una demo para *${restaurantName}*.`,
    ``,
    `Para que puedas ver el sistema funcionando de forma real durante la demostración, vamos a crear *tu cuenta de administrador dentro de la plataforma*.`,
    ``,
    `¿Podrías confirmarme por favor estos datos?`,
    ``,
    `* Nombre del administrador`,
    `* Correo electrónico (será tu usuario de acceso)`,
    `* Nombre del restaurante o negocio`,
    `* Ciudad`,
    `* Número aproximado de sucursales`,
    ``,
    `Con esta información prepararé tu sistema para que puedas probarlo antes de la demo.`,
    ``,
    `Una vez creada tu cuenta, te enviaré *tus credenciales de acceso y una guía rápida de inicio* para que puedas explorar la plataforma.`,
    ``,
    `Quedo atento 👍`
  ].join("\n");
}
