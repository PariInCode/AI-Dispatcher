import { Router } from "express";
import { dispatchOrder, listAssignments, listEvents } from "../controllers/dispatch.controller.js";

const router = Router();
router.post("/", dispatchOrder);
router.get("/assignments", listAssignments);
router.get("/events", listEvents);
export default router;