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
      console.error("❌ BREVO API KEY no está configurada (config.brevo.apiKey)");
      return false;
    }
    if (!senderEmail) {
      console.error("❌ BREVO senderEmail no está configurado (config.brevo.senderEmail)");
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
      const bodyText = await res.text().catch(() => "");
      console.error(
        `❌ Error al enviar email (Brevo). Status: ${res.status} ${res.statusText}. Body: ${bodyText}`,
      );
      return false;
    }

    console.log(`✅ Email enviado a ${options.to}`);
    return true;
  } catch (error) {
    console.error("❌ Error al enviar email:", error);
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
