import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config/env";

// Importar rutas
import authRoutes from "./routes/auth.routes";
import linksRoutes from "./routes/links.routes";
import paymentsRoutes from "./routes/payments.routes";
import analyticsRoutes from "./routes/analytics.routes";
import adminRoutes from "./routes/admin.routes";
import configRoutes from "./routes/config.routes";
import wompiRoutes from "./routes/wompi.routes";

const app = express();

// Middlewares globales
const allowedOrigins = [
  config.urls.frontend,
  "https://onlyprogramlink.com",
  "https://www.onlyprogramlink.com",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: config.urls.frontend,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger de requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/config", configRoutes);
app.use("/api/wompi", wompiRoutes);

// Ruta 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Endpoint no encontrado",
    code: "NOT_FOUND",
    path: req.path,
  });
});

// Manejador de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error no manejado:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    code: "SERVER_ERROR",
    message: config.nodeEnv === "development" ? err.message : undefined,
  });
});

// Iniciar servidor
app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🛡️  ONLY PROGRAM API SERVER         ║
║                                        ║
║   🚀 Servidor corriendo en:           ║
║   📍 http://localhost:${config.port}         ║
║                                        ║
║   🌍 Entorno: ${config.nodeEnv}           ║
║   📧 Brevo configurado                ║
║   🔐 Supabase Auth activo             ║
╚════════════════════════════════════════╝
  `);
  // Keep-Alive Mechanism for Render Free Tier
  // Pings the health endpoint every 5 minutes to prevent sleep
  const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const SERVER_URL = config.urls.backend || `http://localhost:${config.port}`;

  const pinger = setInterval(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/health`);
      if (response.ok) {
        console.log(`[Keep-Alive] Ping successful to ${SERVER_URL}/health at ${new Date().toISOString()}`);
      } else {
        console.warn(`[Keep-Alive] Ping failed with status ${response.status}`);
      }
    } catch (error: any) {
      console.error(`[Keep-Alive] Ping error: ${error.message}`);
    }
  }, PING_INTERVAL);

  // Ensure interval is cleared on shutdown (optional but good practice)
  process.on('SIGTERM', () => clearInterval(pinger));
  process.on('SIGINT', () => clearInterval(pinger));

});

export default app;
