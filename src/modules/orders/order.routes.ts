import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import { listMyOrders, placeOrder } from "./order.controller.js";

const router = Router();

router.post("/", requireAuth, placeOrder);
router.get("/", requireAuth, listMyOrders);

export default router;
