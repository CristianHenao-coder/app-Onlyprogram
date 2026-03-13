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
 * Envía un enlace de recuperación de contraseña
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
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
        .button { display: inline-block; background: linear-gradient(to right, #1DA1F2, #1E90FF); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; margin-top: 24px; font-weight: bold; font-size: 16px; }
        .warning { font-size: 13px; color: #1DA1F2; margin-top: 24px; }
        .footer { font-size: 12px; color: #555; margin-top: 48px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🛡️ ONLY PROGRAM</h1>
        </div>
        <div class="content">
          <h2 style="color: white; font-size: 20px;">Restablecer Contraseña</h2>
          <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva:</p>
          
          <a href="\${resetLink}" class="button">Restablecer Mi Contraseña</a>
          
          <p class="warning">Este enlace expirará por razones de seguridad en unos minutos.</p>
        </div>
        <div class="footer">
          <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
          <p>© \${new Date().getFullYear()} Only Program. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "🔐 Restablecer tu contraseña",
    htmlContent,
    textContent: `Haz clic en el siguiente enlace para restablecer tu contraseña: \${resetLink}`,
  });
}

/**
 * Envía email de confirmación de pago con instrucciones de activación
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
        .steps { background: #1A1A1A; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #333; }
        .steps h3 { color: #FFF; margin-top: 0; }
        .steps ol { padding-left: 20px; margin: 0; }
        .steps li { margin-bottom: 10px; color: #E0E0E0; }
        .button { display: inline-block; background: linear-gradient(to right, #1DA1F2, #1E90FF); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; text-align: center; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🛡️ ONLY <span style="font-size: 14px;">PROGRAM</span></h1>
        </div>
        <div class="content">
          <h2 style="color: #00FF00; text-align: center;">¡Pago Recibido Exitosamente!</h2>
          <div class="success">
            <strong>Monto:</strong> ${amount} ${currency}<br>
            <strong>ID de Orden:</strong> <code>${orderId}</code>
          </div>
          <p>Muchas gracias por tu compra. Para que tu Link Smart empiece a funcionar y sea público, por favor sigue estos 3 simples pasos:</p>
          
          <div class="steps">
            <h3>Paso a paso para la Activación</h3>
            <ol>
              <li><strong>Ingresa al Dashboard:</strong> Inicia sesión y ve a la sección de "Tus Links".</li>
              <li><strong>Personaliza tu Link:</strong> Configura la imagen, el estilo de la Landing Page, y edita las URL de destino de tus botones. Recuerda elegir tu dominio personalizado o el por defecto.</li>
              <li><strong>Espera la Verificación:</strong> Una vez guardes los cambios, un administrador de nuestro equipo revisará y activará tu link. Verás una notificación verde en tu pantalla cuando esté listo.</li>
            </ol>
          </div>
          
          <div style="text-align: center;">
            <a href="${frontendUrl}/dashboard/links" class="button">Ir a Configurar mi Link</a>
          </div>
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
    subject: "✅ Confirmación de Pago y Pasos de Activación - Only Program",
    htmlContent,
    textContent: `Pago exitoso de ${amount} ${currency}. ID: ${orderId}. Por favor ingresa al dashboard, configura tu link y espera la verificación de un administrador.`,
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
 * Envía email avisando expiración de link
 */
export async function sendExpirationAlertEmail(
  email: string,
  userName: string,
  linkSlug: string,
  expiryDate: Date,
  daysRemaining: number,
): Promise<boolean> {
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  let urgencyColor = "#F59E0B"; // Amarillo por defecto (5 o 3 días)
  let headerText = `⏳ ¡Tu link vence en ${daysRemaining} días!`;
  
  if (daysRemaining <= 1) {
    urgencyColor = "#EF4444"; // Rojo si falta 1 día
    headerText = "🚨 ¡Tu link vence MAÑANA!";
  } else if (daysRemaining === 3) {
    headerText = "⏳ Tu link está por expirar";
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #0B0B0B; color: #C9CCD1; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #161616; border: 1px solid #2A2A2A; border-radius: 16px; overflow: hidden; }
        .header { background: ${urgencyColor}; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 20px; font-weight: 800; }
        .body { padding: 40px; }
        .greeting { font-size: 18px; color: white; font-weight: 600; margin-bottom: 12px; }
        .content { line-height: 1.6; margin-bottom: 30px; }
        .link-box { background: #000; border: 1px solid #333; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .slug { color: #1DA1F2; font-weight: bold; }
        .button { display: block; background: ${urgencyColor}; color: white; padding: 14px; text-decoration: none; border-radius: 10px; font-weight: 700; text-align: center; }
        .footer { text-align: center; padding: 20px; font-size: 11px; color: #555; border-top: 1px solid #222; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://fptwztporosusnwcwvny.supabase.co/storage/v1/object/public/public-fotos/logoOnly.png" alt="Only Program Logo" style="height: 40px; width: auto; margin-bottom: 5px;">
          <h1>${headerText}</h1>
        </div>
        <div class="body">
          <div class="greeting">Hola, ${userName}</div>
          <div class="content">
            <p>Te informamos que tu link seguro perderá su activación en <strong>${daysRemaining} días</strong>.</p>
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
    subject: `Aviso de expiración: ${daysRemaining} días restantes — Only Program`,
    htmlContent,
    textContent: `Hola ${userName}, tu link ${linkSlug} vence el ${fmt(expiryDate)}. Renuévalo ahora en ${frontendUrl}/dashboard/links para evitar interrupciones.`,
  });
}

/**
 * Envía email para restablecer la contraseña
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
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
        .title { color: white; font-size: 20px; font-weight: 900; margin-bottom: 12px; }
        .button { display: inline-block; background: #1DA1F2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; margin: 24px 0; font-size: 16px; }
        .footer { font-size: 12px; color: #555; margin-top: 48px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🛡️ ONLY PROGRAM</h1>
        </div>
        <div class="content">
          <div class="title">Restablecer Contraseña</div>
          <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
          <a href="${resetLink}" class="button">Restablecer Mi Contraseña</a>
          <p style="font-size: 13px; color: #888; margin-top: 20px;">
            Si no solicitaste este cambio, puedes ignorar este correo sin problemas. El enlace expirará pronto por tu seguridad.
          </p>
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
    subject: "Restablece tu contraseña - Only Program",
    htmlContent,
    textContent: `Hemos recibido una solicitud para restablecer tu contraseña. Visita el siguiente enlace para continuar: ${resetLink}`,
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

/**
 * Envía email notificando que la cuenta ha sido bloqueada temporalmente
 */
export async function sendAccountLockoutEmail(
  email: string,
  lockedUntil: string,
): Promise<boolean> {
  const lockedTime = lockedUntil
    ? new Date(lockedUntil).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : "10 minutos";

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
        .icon { font-size: 64px; margin-bottom: 24px; }
        .title { color: white; font-size: 22px; font-weight: 900; margin-bottom: 12px; }
        .body-text { color: #888; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .highlight { background: #EF444415; border: 1px solid #EF444430; border-radius: 12px; padding: 16px; color: #EF4444; font-weight: 700; margin: 24px 0; font-size: 15px; }
        .info-box { background: #1DA1F210; border: 1px solid #1DA1F230; border-radius: 12px; padding: 16px; color: #1DA1F2; font-size: 13px; margin-top: 16px; }
        .footer { font-size: 12px; color: #555; margin-top: 48px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🛡️ ONLY PROGRAM</h1>
        </div>
        <div class="icon">🔒</div>
        <div class="title">Acceso Temporalmente Bloqueado</div>
        <div class="body-text">
          Hemos detectado <strong>3 intentos fallidos consecutivos</strong> al ingresar el código de verificación 
          en tu cuenta de Only Program.
        </div>
        <div class="highlight">
          Tu acceso ha sido bloqueado hasta las <strong>${lockedTime}</strong>
        </div>
        <div class="info-box">
          ℹ️ Si fuiste tú quien realizó estos intentos, simplemente espera los 10 minutos y solicita un nuevo código.
          Si <strong>no reconoces esta actividad</strong>, te recomendamos cambiar tu contraseña.
        </div>
        <div class="footer">
          <p>Si necesitas ayuda, contáctanos en support@onlyprogramlink.com</p>
          <p>© ${new Date().getFullYear()} Only Program. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "🔒 Acceso temporalmente bloqueado — Only Program",
    htmlContent,
    textContent: `Tu acceso a Only Program ha sido bloqueado hasta las ${lockedTime} por múltiples intentos fallidos. Si no fuiste tú, cambia tu contraseña.`,
  });
}
