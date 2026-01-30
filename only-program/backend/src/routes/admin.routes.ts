import { Router } from "express";
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from "../middlewares/auth.middleware";

const router = Router();

// Todas las rutas requieren autenticación y rol admin
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * Obtiene lista de usuarios (solo admin)
 */
router.get("/users", async (req: AuthRequest, res) => {
  res.json({
    message: "Endpoint de administración - Por implementar",
    admin: req.user,
  });
});

export default router;
