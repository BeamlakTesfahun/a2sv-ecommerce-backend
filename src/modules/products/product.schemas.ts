import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10),
  price: z.coerce.number().positive(), // supports JSON or multipart
  stock: z.coerce.number().int().nonnegative(),
  category: z.string().min(1).max(50).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// if no query is provided all products will be returned
export const listProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional(),
    search: z.string().trim().optional(),
  })
  .transform((q) => {
    const pageSize = q.limit ?? q.pageSize ?? 10;
    return {
      page: q.page,
      pageSize,
      search: q.search && q.search.length ? q.search : undefined, // undefined if no filter
    };
  });
