import type { Response, NextFunction } from "express";
import { placeOrderSchema } from "./order.schemas.js";
import { listMyOrdersSvc, placeOrderSvc } from "./order.service.js";
import type { AuthedRequest } from "../../middlewares/auth.js";

// place a new order (authenticated)
export async function placeOrder(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const dto = placeOrderSchema.parse(req.body);

    const order = await placeOrderSvc(req.user.userId, dto);
    return res
      .status(201)
      .json({ success: true, message: "Order created", object: order });
  } catch (err: any) {
    if (err.name === "ZodError") {
      console.error("Zod issues:", err.issues); // <-- added log
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues?.map((i: any) => i.message),
      });
    }
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const orders = await listMyOrdersSvc(req.user.userId);
    return res
      .status(200)
      .json({ success: true, message: "OK", object: orders });
  } catch (err: any) {
    if (err.name === "ZodError") {
      console.error("Zod issues:", err.issues); // optional: log here too
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues?.map((i: any) => i.message),
      });
    }
    next(err);
  }
}
