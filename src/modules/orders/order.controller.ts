import type { Response, NextFunction } from "express";
import { z } from "zod";
import { createOrderSchema } from "./order.schemas.js";
import { listMyOrdersSvc, placeOrderSvc } from "./order.service.js";
import type { AuthedRequest } from "../../middlewares/auth.js";

// place a new order (authenticated)
export async function placeOrder(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const dto = createOrderSchema.parse(req.body);

    const order = await placeOrderSvc(req.user.userId, dto);
    return res.status(201).json({
      success: true,
      message: "Order placed",
      object: order,
    });
  } catch (err: any) {
    if (err.name === "ZodError")
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues.map((i: any) => i.message),
      });
    next(err);
  }
}

// fetch only my orders
export async function listMyOrders(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const orders = await listMyOrdersSvc(req.user.userId);
    return res.status(200).json({
      success: true,
      message: "OK",
      object: orders,
    });
  } catch (err) {
    next(err);
  }
}
