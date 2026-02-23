import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Validar variables requeridas
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ERROR: Variable de entorno ${envVar} no está definida`);
    console.error(
      `Asegúrate de tener un archivo .env en backend/ con todas las variables necesarias`,
    );
    process.exit(1);
  }
}

// Exportar configuración
export const config = {
  port: parseInt(process.env.PORT || "4005"),
  nodeEnv: process.env.NODE_ENV || "development",

  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
  },

  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-change-in-production",
  },

  brevo: {
    apiKey: process.env.BREVO_API_KEY || "",
    senderEmail: process.env.BREVO_SENDER_EMAIL || "noreply@onlyprogram.com",
    senderName: process.env.BREVO_SENDER_NAME || "Only Program",
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
    apiUrl: process.env.PAYPAL_API_URL || "https://api-m.paypal.com",
  },

  nowpayments: {
    apiKey: process.env.API_KEY_NOWPAYMENTS || "",
    ipnSecret: process.env.IPN_SECRET_NOWPAYMENTS || "",
    publicKey: process.env.PUBLIC_KEY_NOWPAYMENTS || "",
    apiUrl: "https://api.nowpayments.io/v1",
  },

  urls: {
    frontend: process.env.FRONTEND_URL || "http://localhost:3000",
    backend: process.env.BACKEND_URL || "http://localhost:4005",
  },

  godaddy: {
    apiKey: process.env.GODADDY_API_KEY || "",
    apiSecret: process.env.GODADDY_API_SECRET || "",
    env: process.env.GODADDY_ENV || "OTE",
  },

  wompi: {
    pubKey: process.env.WOMPI_PUB_KEY || "",
    prvKey: process.env.WOMPI_PRV_KEY || "",
    eventsSecret: process.env.WOMPI_EVENTS_SECRET || "",
    integritySecret: process.env.WOMPI_INTEGRITY_SECRET || "",
    url: process.env.WOMPI_API_URL || "https://production.wompi.co/v1", // Default to production
  },

  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY || "",
    secretKey: process.env.TURNSTILE_SECRET_KEY || "",
  },
};

console.log("✅ Variables de entorno cargadas correctamente");
console.log(`📍 Supabase URL: ${config.supabase.url}`);
console.log(`🌍 Frontend URL: ${config.urls.frontend}`);
