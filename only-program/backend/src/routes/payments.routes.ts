import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

// Todas las rutas de payments requieren autenticación
router.use(authenticateToken);

/**
 * GET /api/payments
 * Obtiene el historial de pagos del usuario
 */
router.get("/", async (req: AuthRequest, res) => {
  res.json({
    message: "Endpoint de pagos - Por implementar",
    user: req.user,
  });
});

export default router;
