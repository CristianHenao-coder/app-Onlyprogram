import { Router, Request, Response } from "express";
import { config } from "../config/env";

const router = Router();

/**
 * GET /api/config/turnstile
 * Retorna la clave de sitio para Cloudflare Turnstile
 */
router.get("/turnstile", (_req: Request, res: Response) => {
  res.json({
    siteKey: config.turnstile.siteKey,
  });
});

export default router;
