import { Router } from "express";
import {
  searchDomains,
  buyDomain,
  verifyDomainExistence,
  requestDomainLink,
  cancelDomainReservation,
} from "../controllers/domains.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/search", searchDomains);
router.get("/verify", verifyDomainExistence);
router.post("/request", authenticateToken, requestDomainLink);
router.delete(
  "/reservation/:linkId",
  authenticateToken,
  cancelDomainReservation,
);
router.post("/buy", authenticateToken, buyDomain);

export default router;
