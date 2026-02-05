import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Validar variables requeridas
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "JWT_SECRET", // Ahora es obligatorio
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
    secret: process.env.JWT_SECRET!, // Forzado por la validación anterior
  },

  brevo: {
    apiKey: process.env.BREVO_API_KEY || "",
    senderEmail: process.env.BREVO_SENDER_EMAIL || "noreply@onlyprogram.com",
    senderName: process.env.BREVO_SENDER_NAME || "Only Program",
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
    apiUrl: process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com",
  },

  redotpay: {
    apiKey: process.env.REDOTPAY_API_KEY || "",
    appId: process.env.REDOTPAY_APP_ID || "",
    apiUrl: process.env.REDOTPAY_API_URL || "https://api.redotpay.com",
  },

  urls: {
    frontend: process.env.FRONTEND_URL || "http://localhost:3000",
    backend: process.env.BACKEND_URL || "http://localhost:4005",
  },
};

console.log("Variables de entorno cargadas correctamente");
console.log("Variables de entorno cargadas correctamente");
// Logs de URL eliminados por seguridad (Info Disclosure)
