import { z } from "zod";

export const orderItemInputSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number().int().positive(), // must be >= 1
});

export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, "At least one item is required"),
  description: z.string().min(1).optional(),
});
