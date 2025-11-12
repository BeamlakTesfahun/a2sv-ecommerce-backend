// src/modules/products/product.cache.ts
import { cacheGet, cacheSet, cacheDelPrefix } from "../../libs/cache.js";
import type { Prisma } from "@prisma/client";
import { listProductsSvc } from "./product.service.js";

export type ListOpts = { page?: number; pageSize?: number; search?: string };

const PREFIX = "products:list:";

function makeKey({ page, pageSize, search }: ListOpts) {
  return `${PREFIX}${page ?? 1}:${pageSize ?? 10}:${(search ?? "").toLowerCase()}`;
}

// get products with caching
export async function getProductsCached(opts: ListOpts) {
  const key = makeKey(opts);
  const cached = cacheGet<any>(key);
  if (cached) return cached;

  const data = await listProductsSvc(opts);
  cacheSet(key, data, 60_000); // 60s TTL
  return data;
}

export function invalidateProductLists() {
  cacheDelPrefix(PREFIX);
}
