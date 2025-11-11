import { prisma } from "../../libs/prisma.js";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { createProductSchema, updateProductSchema } from "./product.schemas.js";

export type CreateProductDTO = z.infer<typeof createProductSchema>;
export type UpdateProductDTO = z.infer<typeof updateProductSchema>;

function httpError(status: number, message: string) {
  const e: any = new Error(message);
  e.status = status;
  return e;
}

export async function createProductSvc(
  dto: CreateProductDTO,
  imageUrl: string | null
) {
  if (dto.price <= 0) throw httpError(400, "Price must be positive");
  if (!Number.isInteger(dto.stock) || dto.stock < 0)
    throw httpError(400, "Stock must be a non-negative integer");

  const data: Prisma.ProductCreateInput = {
    name: dto.name,
    description: dto.description,
    price: dto.price,
    stock: dto.stock,
    ...(dto.category !== undefined ? { category: dto.category } : {}),
    imageUrl, // may be null
  };

  return prisma.product.create({ data });
}

export async function getProductOrThrowSvc(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw httpError(404, "Product not found");
  return product;
}

export async function updateProductSvc(id: string, dto: UpdateProductDTO) {
  await getProductOrThrowSvc(id);

  if (dto.price !== undefined && dto.price <= 0)
    throw httpError(400, "Price must be positive");
  if (
    dto.stock !== undefined &&
    (!Number.isInteger(dto.stock) || dto.stock < 0)
  ) {
    throw httpError(400, "Stock must be a non-negative integer");
  }

  const data: Prisma.ProductUpdateInput = {
    ...(dto.name !== undefined ? { name: dto.name } : {}),
    ...(dto.description !== undefined ? { description: dto.description } : {}),
    ...(dto.price !== undefined ? { price: dto.price } : {}),
    ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
    ...(dto.category !== undefined ? { category: dto.category } : {}),
  };

  return prisma.product.update({ where: { id }, data });
}

export async function deleteProductSvc(id: string) {
  await getProductOrThrowSvc(id);
  await prisma.product.delete({ where: { id } });
}

export async function listProductsSvc(opts: {
  page?: number;
  pageSize?: number;
  search?: string; // undefined means no filter
}) {
  const page = Math.max(1, Number(opts.page ?? 1));
  const pageSize = Math.max(1, Number(opts.pageSize ?? 10));

  const where: Prisma.ProductWhereInput = opts.search
    ? { name: { contains: opts.search, mode: "insensitive" } }
    : {};

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { page, pageSize, total, totalPages, products };
}
