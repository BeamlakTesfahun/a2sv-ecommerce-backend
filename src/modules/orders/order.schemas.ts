import { z } from "zod";

const OrderLine = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number().int().positive(), // >= 1
});

export const placeOrderSchema = z
  .object({
    description: z.string().min(3).optional(), // "test" passes
  })
  .and(
    z.union([
      z.object({
        items: z.array(OrderLine).min(1, "At least one item is required"),
      }),
      z
        .object({
          products: z.array(OrderLine).min(1, "At least one item is required"),
        })
        .transform(({ products, ...rest }) => ({ ...rest, items: products })),
    ])
  );

export type PlaceOrderDTO = z.infer<typeof placeOrderSchema>;
