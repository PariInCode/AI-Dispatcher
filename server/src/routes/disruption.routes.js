import { Router } from "express";
import { cancelDriver, resetDemo , urgentOrder } from "../controllers/disruption.controller.js";

const router = Router();
router.post("/cancel", cancelDriver);
router.post("/reset", resetDemo);
router.post("/urgent", urgentOrder);
export default router;