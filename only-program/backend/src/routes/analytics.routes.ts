import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/analytics/overview
 * Obtiene resumen de analíticas
 */
router.get("/overview", async (req: AuthRequest, res) => {
  res.json({
    message: "Endpoint de analytics - Por implementar",
    user: req.user,
  });
});

export default router;
