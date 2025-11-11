import { prisma } from "../../libs/prisma.js";
import { z } from "zod";
import { createOrderSchema } from "./order.schemas.js";

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;

function httpError(status: number, message: string) {
  const e: any = new Error(message);
  e.status = status;
  return e;
}

function asNumber(x: unknown): number {
  if (typeof x === "number") return x;
  if (typeof x === "string") return parseFloat(x);
  return parseFloat(x?.toString?.() ?? "0");
}

// place a new order (authenticated)
export async function placeOrderSvc(userId: string, dto: CreateOrderDTO) {
  const qtyById = new Map<string, number>();
  for (const it of dto.items) {
    qtyById.set(it.productId, (qtyById.get(it.productId) ?? 0) + it.quantity);
  }
  const productIds = [...qtyById.keys()];
  // fetch products
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true, stock: true, name: true },
  });

  // make sure all products exist
  if (products.length !== productIds.length) {
    const found = new Set(products.map((p) => p.id));
    const missing = productIds.filter((id) => !found.has(id));
    throw httpError(404, `Product(s) not found: ${missing.join(", ")}`);
  }

  // stock check + total calc
  let total = 0;
  for (const p of products) {
    const qty = qtyById.get(p.id)!;
    if (p.stock < qty) {
      throw httpError(400, `Insufficient stock for ${p.name}`);
    }
    total += asNumber(p.price) * qty;
  }

  // everything looks good - proceed with order inside a transaction
  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId,
        description: dto.description ?? null,
        totalPrice: total,
        // set status to pending by default
      },
      select: { id: true },
    });

    // create items
    await tx.orderItem.createMany({
      data: products.map((p) => ({
        orderId: createdOrder.id,
        productId: p.id,
        quantity: qtyById.get(p.id)!,
        price: p.price,
      })),
    });

    // decrement stock
    await Promise.all(
      products.map((p) =>
        tx.product.update({
          where: { id: p.id },
          data: { stock: p.stock - qtyById.get(p.id)! },
        })
      )
    );

    // return full order with summary + items
    return tx.order.findUniqueOrThrow({
      where: { id: createdOrder.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });
  });

  // normalize numbers
  const normalized = {
    ...order,
    totalPrice: asNumber(order.totalPrice),
    items: order.items.map((it) => ({
      ...it,
      price: asNumber(it.price),
    })),
  };

  return normalized;
}

// list order history for user (authenticated)
export async function listMyOrdersSvc(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        select: {
          productId: true,
          quantity: true,
          price: true,
        },
      },
    },
  });

  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    totalPrice: asNumber(o.totalPrice),
    createdAt: o.createdAt,
    itemsCount: o.items.reduce((n, it) => n + it.quantity, 0),
  }));
}
