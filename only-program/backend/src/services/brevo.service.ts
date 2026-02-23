import { config } from "../config/env";

const apiKey = config.brevo.apiKey;
const senderEmail = config.brevo.senderEmail;
const senderName = config.brevo.senderName;
const frontendUrl = config.urls.frontend;

// Endpoint oficial Brevo para enviar email transaccional
const BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Envía un email usando Brevo (API REST)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!apiKey) {
      console.error(
        "❌ BREVO API KEY no está configurada (config.brevo.apiKey)",
      );
      return false;
    }
    if (!senderEmail) {
      console.error(
        "❌ BREVO senderEmail no está configurado (config.brevo.senderEmail)",
      );
      return false;
    }

    const payload: any = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: options.to, name: options.toName || options.to }],
      subject: options.subject,
      htmlContent: options.htmlContent,
      replyTo: {
        email: "support@onlyprogramlink.com",
        name: "Only Program Support",
      },
    };

    if (options.textContent) {
      payload.textContent = options.textContent;
    }

    const res = await fetch(BREVO_SEND_EMAIL_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "Sin cuerpo de respuesta");
      console.error(
        `❌ Error al enviar email (Brevo). Status: ${res.status} ${res.statusText}. Payload: ${JSON.stringify(payload)}. Body: ${bodyText}`,
      );

      if (res.status === 401) {
        console.error("💡 TIP: La API Key de Brevo parece ser inválida.");
      } else if (res.status === 403) {
        console.error(
          "💡 TIP: Es posible que el remitente (senderEmail) no esté verificado en Brevo.",
        );
      }

      return false;
    }

    console.log(`✅ Email enviado exitosamente a: ${options.to}`);
    return true;
  } catch (error) {
    console.error("❌ Error inesperado al enviar email con Brevo:", error);
    return false;
  }
}

/**
 * Envía email de bienvenida a un nuevo usuario
 */
export async function sendWelcomeEmail(
  email: string,
  name?: string,
): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #0B0B0B; color: #C9CCD1; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #161616; border: 1px solid #2A2A2A; border-radius: 12px; padding: 40px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #1DA1F2; font-size: 24px; margin: 0; }
        .content { line-height: 1.6; }
        .button { display: inline-block; background: linear-gradient(to right, #1DA1F2, #1E90FF); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🛡️ ONLY <span style="font-size: 14px;">PROGRAM</span></h1>
        </div>
        <div class="content">
          <h2 style="color: white;">¡Bienvenido${name ? `, ${name}` : ""}!</h2>
          <p>Gracias por unirte a Only Program, la plataforma líder en protección de enlaces para creadores de contenido.</p>
          <p>Con Only Program puedes:</p>
          <ul>
            <li>🔒 Generar enlaces seguros y encriptados</li>
            <li>🤖 Bloquear automáticamente bots y scraping</li>
            <li>📊 Monitorear accesos en tiempo real</li>
            <li>💰 Proteger tus ingresos de filtraciones</li>
          </ul>
          <a href="${frontendUrl}/dashboard" class="button">Ir al Dashboard</a>
        </div>
        <div class="footer">
          <p>© 2024 Only Program. Todos los derechos reservados.</p>
          <p>Desarrollado por Cybercore Systems</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    toName: name,
    subject: "¡Bienvenido a Only Program! 🚀",
    htmlContent,
    textContent: `Bienvenido${name ? `, ${name}` : ""} a Only Program! Visita ${frontendUrl}/dashboard para comenzar.`,
  });
}

/**
 * Envía email de recuperación de contraseña
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
): Promise<boolean> {
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #0B0B0B; color: #C9CCD1; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #161616; border: 1px solid #2A2A2A; border-radius: 12px; padding: 40px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #1DA1F2; font-size: 24px; margin: 0; }
        .content { line-height: 1.6; }
        .button { display: inline-block; background: linear-gradient(to right, #1DA1F2, #1E90FF); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; }
        .warning { background: #FFA50020; border-left: 4px solid #FFA500; padding: 12px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🛡️ ONLY <span style="font-size: 14px;">PROGRAM</span></h1>
        </div>
        <div class="content">
          <h2 style="color: white;">Recuperación de Contraseña</h2>
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
          <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
          <div class="warning">
            <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora.
            Si no solicitaste este cambio, ignora este email.
          </div>
          <p style="font-size: 12px; color: #888;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${resetUrl}" style="color: #1DA1F2;">${resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p>© 2024 Only Program. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "Recuperación de Contraseña - Only Program",
    htmlContent,
    textContent: `Restablece tu contraseña aquí: ${resetUrl}. Este enlace expira en 1 hora.`,
  });
}

/**
 * Envía email de notificación de enlace sospechoso
 */
export async function sendSecurityAlertEmail(
  email: string,
  linkSlug: string,
  reason: string,
): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <div style="background-color: white; padding: 20px; border-radius: 5px;">
        <h2 style="color: #d9534f;">🚨 Alerta de Seguridad</h2>
        <p>Se ha detectado actividad sospechosa en tu enlace:</p>
        <p><strong>Slug:</strong> ${linkSlug}</p>
        <p><strong>Motivo:</strong> ${reason}</p>
        <p>Por favor, revisa tus analíticas para más detalles.</p>
        <a href="${frontendUrl}/dashboard/analytics" style="display: inline-block; background-color: #0275d8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Dashboard</a>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "🚨 Alerta de Seguridad - Only Program",
    htmlContent,
    textContent: `Actividad sospechosa detectada en ${linkSlug}: ${reason}. Revisa ${frontendUrl}/dashboard/analytics`,
  });
}

/**
 * Envía un código de verificación para acciones administrativas sensibles
 */
export async function sendAdminVerificationCode(
  email: string,
  code: string,
  action: string,
): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #0B0B0B; color: #C9CCD1; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #161616; border: 1px solid #2A2A2A; border-radius: 24px; padding: 48px; text-align: center; }
        .logo { margin-bottom: 32px; }
        .logo h1 { color: #1DA1F2; font-size: 24px; margin: 0; font-weight: 900; letter-spacing: -0.05em; }
        .content { margin-bottom: 32px; }
        .code-container { background: #000; border: 1px solid #1DA1F240; padding: 24px; border-radius: 16px; margin: 24px 0; }
        .code { font-size: 42px; font-weight: 900; color: #1DA1F2; letter-spacing: 0.25em; font-family: 'Courier New', monospace; }
        .footer { font-size: 12px; color: #555; margin-top: 48px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🛡️ ONLY PROGRAM</h1>
        </div>
        <div class="content">
          <h2 style="color: white; font-size: 20px;">Verificación de Seguridad</h2>
          <p>Has solicitado realizar una acción protegida:</p>
          <p style="color: #1DA1F2; font-weight: bold; font-size: 14px; text-transform: uppercase;">${action}</p>
          
          <div class="code-container">
            <div class="code">${code}</div>
          </div>
          
          <p style="font-size: 13px;">Este código expirará en 10 minutos por seguridad.</p>
        </div>
        <div class="footer">
          <p>Si no solicitaste este código, ignora este mensaje y revisa la seguridad de tu cuenta.</p>
          <p>© 2024 Only Program Admin Security</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `🔐 Código de Verificación: ${code}`,
    htmlContent,
    textContent: `Tu código de verificación para ${action} es: ${code}. Expira en 10 minutos.`,
  });
}

/**
 * Envía email de confirmación de pago
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  amount: number,
  currency: string,
  orderId: string,
): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #0B0B0B; color: #C9CCD1; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #161616; border: 1px solid #2A2A2A; border-radius: 12px; padding: 40px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #1DA1F2; font-size: 24px; margin: 0; }
        .content { line-height: 1.6; }
        .success { background: #00FF0020; border-left: 4px solid #00FF00; padding: 12px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; background: linear-gradient(to right, #1DA1F2, #1E90FF); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🛡️ ONLY <span style="font-size: 14px;">PROGRAM</span></h1>
        </div>
        <div class="content">
          <h2 style="color: #00FF00;">¡Pago Exitoso!</h2>
          <div class="success">
            <strong>Tu pago ha sido procesado correctamente</strong><br>
            Monto: ${amount} ${currency}<br>
            ID de Orden: <code>${orderId}</code>
          </div>
          <p>Gracias por tu compra. Tu cuenta ha sido actualizada.</p>
          <a href="${frontendUrl}/dashboard/billing" class="button">Ver Facturación</a>
        </div>
        <div class="footer">
          <p>© 2024 Only Program. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "✅ Confirmación de Pago - Only Program",
    htmlContent,
    textContent: `Pago exitoso de ${amount} ${currency}. ID: ${orderId}.`,
  });
}

/**
 * Envía un código OTP multilingüe (ES, EN, FR)
 */
export async function sendOTPEmail(
  email: string,
  code: string,
  lang: string = "es",
): Promise<boolean> {
  const translations = {
    es: {
      subject: `🔐 Tu código de verificación: ${code}`,
      title: "Verificación de Seguridad",
      subtitle:
        "Usa el siguiente código para completar tu acción en Only Program:",
      warning: "Este código expirará en 10 minutos por seguridad.",
      spamNote:
        "Si no recibes el código, por favor revisa tu carpeta de SPAM o correo no deseado.",
      footer: "Si no solicitaste este código, puedes ignorar este mensaje.",
    },
    en: {
      subject: `🔐 Your verification code: ${code}`,
      title: "Security Verification",
      subtitle:
        "Use the following code to complete your action on Only Program:",
      warning: "This code will expire in 10 minutes for security reasons.",
      spamNote:
        "If you don't receive the code, please check your SPAM or junk folder.",
      footer:
        "If you did not request this code, you can safely ignore this message.",
    },
    fr: {
      subject: `🔐 Votre code de vérification : ${code}`,
      title: "Vérification de Sécurité",
      subtitle:
        "Utilisez le code suivant pour terminer votre action sur Only Program :",
      warning: "Ce code expirera dans 10 minutes par mesure de sécurité.",
      spamNote:
        "Si vous ne recevez pas le code, veuillez vérifier votre dossier SPAM o courrier indésirable.",
      footer:
        "Si vous n'avez pas demandé ce code, vous pouvez ignorer ce message.",
    },
  };

  const t = (translations as any)[lang] || translations.es;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #0B0B0B; color: #C9CCD1; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #161616; border: 1px solid #2A2A2A; border-radius: 24px; padding: 48px; text-align: center; }
        .logo { margin-bottom: 32px; }
        .logo h1 { color: #1DA1F2; font-size: 24px; margin: 0; font-weight: 900; letter-spacing: -0.05em; }
        .content { margin-bottom: 32px; }
        .code-container { background: #000; border: 1px solid #1DA1F240; padding: 24px; border-radius: 16px; margin: 24px 0; }
        .code { font-size: 42px; font-weight: 900; color: #1DA1F2; letter-spacing: 0.25em; font-family: 'Courier New', monospace; }
        .footer { font-size: 12px; color: #555; margin-top: 48px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🛡️ ONLY PROGRAM</h1>
        </div>
        <div class="content">
          <h2 style="color: white; font-size: 20px;">${t.title}</h2>
          <p>${t.subtitle}</p>
          
          <div class="code-container">
            <div class="code">${code}</div>
          </div>
          
          <p style="font-size: 13px; color: #1DA1F2;">${t.warning}</p>
          <div style="margin-top: 20px; padding: 15px; background: rgba(255,165,0,0.1); border-radius: 12px; font-size: 12px; color: #FFA500;">
            ⚠️ ${t.spamNote}
          </div>
        </div>
        <div class="footer">
          <p>${t.footer}</p>
          <p>© ${new Date().getFullYear()} Only Program. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: t.subject,
    htmlContent,
    textContent: `${t.subtitle} ${code}. ${t.warning}`,
  });
}

/**
 * Envía email de factura para el plan gratuito de 3 días
 */
export async function sendFreeTrialInvoiceEmail(
  email: string,
  userName: string,
  paymentDate: Date,
  nextBillingDate: Date,
  orderId: string,
): Promise<boolean> {
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #0B0B0B; color: #C9CCD1; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #161616; border: 1px solid #2A2A2A; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1DA1F2 0%, #0d6efd 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.03em; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); color: white; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 10px; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 17px; color: white; font-weight: 600; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #888; margin-bottom: 28px; line-height: 1.6; }
        .invoice-box { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .invoice-title { font-size: 11px; font-weight: 700; color: #1DA1F2; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 18px; }
        .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #242424; font-size: 14px; }
        .invoice-row:last-child { border-bottom: none; }
        .invoice-row .label { color: #888; }
        .invoice-row .value { color: white; font-weight: 600; }
        .total-row { background: #1DA1F210; border-radius: 8px; padding: 14px 16px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
        .total-row .label { color: #1DA1F2; font-weight: 700; font-size: 14px; }
        .total-row .value { color: #1DA1F2; font-size: 22px; font-weight: 900; }
        .domain-box { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .domain-title { font-size: 11px; font-weight: 700; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 14px; }
        .step { display: flex; gap: 12px; margin-bottom: 14px; align-items: flex-start; }
        .step-num { background: #1DA1F2; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; min-width: 24px; }
        .step-text { font-size: 13px; color: #C9CCD1; line-height: 1.5; }
        .step-text code { background: #000; color: #1DA1F2; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }
        .button { display: block; background: linear-gradient(to right, #1DA1F2, #0d6efd); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; text-align: center; margin-top: 24px; font-size: 15px; }
        .warning { background: #F59E0B15; border: 1px solid #F59E0B40; border-radius: 10px; padding: 14px 16px; margin-top: 20px; font-size: 13px; color: #F59E0B; }
        .footer { text-align: center; padding: 24px 40px; font-size: 12px; color: #555; border-top: 1px solid #222; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://fptwztporosusnwcwvny.supabase.co/storage/v1/object/public/public-fotos/logoOnly.png" alt="Only Program Logo" style="height: 50px; width: auto; margin-bottom: 10px;">
          <br>
          <span class="badge">🎁 Activación Exitosa</span>
        </div>
        <div class="body">
          <div class="greeting">¡Bienvenido a tu prueba gratuita, ${userName || "Usuario"}!</div>
          <div class="subtitle">Tu plan de prueba ha sido activado correctamente. Disfruta 3 días completos con todas las funciones del sistema.</div>

          <div class="invoice-box">
            <div class="invoice-title">📄 Factura · ${orderId.slice(0, 8).toUpperCase()}</div>
            <div class="invoice-row"><span class="label">Plan</span><span class="value">Link Estándar — Prueba Gratuita</span></div>
            <div class="invoice-row"><span class="label">Método de pago</span><span class="value">🎁 Gratuito</span></div>
            <div class="invoice-row"><span class="label">Fecha de activación</span><span class="value">${fmt(paymentDate)}</span></div>
            <div class="invoice-row"><span class="label">Vence / Próximo cobro</span><span class="value">${fmt(nextBillingDate)}</span></div>
            <div class="total-row">
              <span class="label">Total cobrado</span>
              <span class="value">$0.00 USD</span>
            </div>
          </div>

          <div class="domain-box">
            <div class="domain-title">🌐 Cómo conectar tu dominio personalizado</div>
            <div class="step">
              <div class="step-num">1</div>
              <div class="step-text">Entra a tu proveedor (GoDaddy / Cloudflare) y ve a la configuración DNS de tu dominio.</div>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <div class="step-text">Agrega un registro <code>A</code> apuntando a la IP de tu servidor: <code>${process.env.SERVER_IP || "IP del servidor"}</code></div>
            </div>
            <div class="step">
              <div class="step-num">3</div>
              <div class="step-text">En tu dashboard Only Program → "Mis Links" → edita tu link y asigna tu dominio personalizado.</div>
            </div>
            <div class="step">
              <div class="step-num">4</div>
              <div class="step-text">Caddy gestionará el certificado SSL automáticamente cuando el DNS propague (hasta 24h).</div>
            </div>
          </div>

          <div class="warning">
            ⏰ <strong>Recuerda:</strong> Tu prueba gratuita vence el <strong>${fmt(nextBillingDate)}</strong>. 
            Después de esta fecha necesitarás adquirir un plan de pago para mantener tu link activo.
          </div>

          <a href="${frontendUrl}/dashboard" class="button">Ir al Dashboard →</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Only Program. Todos los derechos reservados.</p>
          <p>¿Dudas? Responde este correo o escríbenos a support@onlyprogramlink.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    toName: userName,
    subject: "🎁 ¡Tu prueba gratuita está activa! — Only Program",
    htmlContent,
    textContent: `¡Hola ${userName}! Tu prueba gratuita de 3 días ha sido activada. Vence el ${fmt(nextBillingDate)}. Factura #${orderId.slice(0, 8).toUpperCase()} — $0.00 USD.`,
  });
}

/**
 * Envía email de alerta 24h antes del vencimiento
 */
export async function sendExpirationAlertEmail(
  email: string,
  userName: string,
  linkSlug: string,
  expiryDate: Date,
): Promise<boolean> {
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #0B0B0B; color: #C9CCD1; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #161616; border: 1px solid #2A2A2A; border-radius: 16px; overflow: hidden; }
        .header { background: #F59E0B; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 20px; font-weight: 800; }
        .body { padding: 40px; }
        .greeting { font-size: 18px; color: white; font-weight: 600; margin-bottom: 12px; }
        .content { line-height: 1.6; margin-bottom: 30px; }
        .link-box { background: #000; border: 1px solid #333; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .slug { color: #1DA1F2; font-weight: bold; }
        .button { display: block; background: #F59E0B; color: white; padding: 14px; text-decoration: none; border-radius: 10px; font-weight: 700; text-align: center; }
        .footer { text-align: center; padding: 20px; font-size: 11px; color: #555; border-top: 1px solid #222; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://fptwztporosusnwcwvny.supabase.co/storage/v1/object/public/public-fotos/logoOnly.png" alt="Only Program Logo" style="height: 40px; width: auto; margin-bottom: 5px;">
          <h1>⏳ ¡Tu link está por expirar!</h1>
        </div>
        <div class="body">
          <div class="greeting">Hola, ${userName}</div>
          <div class="content">
            <p>Te informamos que tu link seguro está por vencer en menos de 24 horas.</p>
            <div class="link-box">
              Link: <span class="slug">${linkSlug}</span><br>
              Vence: <strong>${fmt(expiryDate)}</strong>
            </div>
            <p>Para evitar que tu link sea desactivado y pierdas el acceso de tus seguidores, por favor renueva tu plan ahora.</p>
          </div>
          <a href="${frontendUrl}/dashboard/links" class="button">Renovar Link Ahora</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Only Program. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    toName: userName,
    subject: `⚠️ Aviso: Tu link ${linkSlug} vence pronto — Only Program`,
    htmlContent,
    textContent: `Hola ${userName}, tu link ${linkSlug} vence el ${fmt(expiryDate)}. Renuévalo ahora en ${frontendUrl}/dashboard/links para evitar interrupciones.`,
  });
}

/**
 * Envía email cuando un link ha sido desactivado por vencimiento
 */
export async function sendLinkDeactivatedEmail(
  email: string,
  userName: string,
  linkSlug: string,
): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #0B0B0B; color: #C9CCD1; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #161616; border: 1px solid #2A2A2A; border-radius: 16px; overflow: hidden; }
        .header { background: #EF4444; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 20px; font-weight: 800; }
        .body { padding: 40px; }
        .greeting { font-size: 18px; color: white; font-weight: 600; margin-bottom: 12px; }
        .content { line-height: 1.6; margin-bottom: 30px; }
        .warning-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 15px; border-radius: 8px; color: #EF4444; font-size: 13px; }
        .button { display: block; background: #1DA1F2; color: white; padding: 14px; text-decoration: none; border-radius: 10px; font-weight: 700; text-align: center; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 11px; color: #555; border-top: 1px solid #222; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://fptwztporosusnwcwvny.supabase.co/storage/v1/object/public/public-fotos/logoOnly.png" alt="Only Program Logo" style="height: 40px; width: auto; margin-bottom: 5px;">
          <h1>🚫 Link Desactivado</h1>
        </div>
        <div class="body">
          <div class="greeting">Hola, ${userName}</div>
          <div class="content">
            <p>Tu link <strong>${linkSlug}</strong> ha expirado y ha sido desactivado automáticamente.</p>
            <div class="warning-box">
              Tus seguidores ya no pueden acceder a través de este enlace.
            </div>
            <p>Puedes reactivarlo en cualquier momento adquiriendo un nuevo periodo de vigencia desde tu panel.</p>
          </div>
          <a href="${frontendUrl}/dashboard/links" class="button">Reactivar mi Link</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Only Program. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    toName: userName,
    subject: `🚫 Tu link ${linkSlug} ha sido desactivado — Only Program`,
    htmlContent,
    textContent: `Hola ${userName}, tu link ${linkSlug} ha expirado y ha sido desactivado. Reactívalo en ${frontendUrl}/dashboard/links`,
  });
}
