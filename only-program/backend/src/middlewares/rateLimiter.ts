import rateLimit from "express-rate-limit";

// Limitador general para toda la API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 solicitudes por ventana
  message: {
    error: "Demasiadas solicitudes desde esta IP, por favor intente de nuevo más tarde.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true, // Devuelve información de límite de tasa en los encabezados `RateLimit-*`
  legacyHeaders: false, // Deshabilita los encabezados `X-RateLimit-*`
});

// Limitador estricto para rutas de autenticación y pagos
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Limita cada IP a 10 solicitudes de auth/pago por hora
  message: {
    error: "Se ha excedido el límite de intentos. Por seguridad, su IP ha sido restringida temporalmente.",
    code: "STRICT_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador específico para la creación de links
export const linkCreationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 20, // Máximo 20 links cada 10 minutos
  message: {
    error: "Has creado demasiados links en poco tiempo. Por favor, espera un momento.",
    code: "LINK_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
