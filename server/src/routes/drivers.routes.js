import { Router } from "express";
import { listDrivers, updateDriverStatus } from "../controllers/drivers.controller.js";

const router = Router();
router.get("/", listDrivers);
router.patch("/:id/status", updateDriverStatus);
export default router;