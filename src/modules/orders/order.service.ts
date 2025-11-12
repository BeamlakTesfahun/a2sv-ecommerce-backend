import { prisma } from "../../libs/prisma.js";
import type { PlaceOrderDTO } from "./order.schemas.js";

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
export async function placeOrderSvc(userId: string, dto: PlaceOrderDTO) {
  // consolidate quantities in case same product repeats
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

  // ensure all exist
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

  // transactional create
  const full = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        description: dto.description ?? null,
        totalPrice: total,
        // status: "pending", // set if not defaulted in your schema
      },
      select: { id: true },
    });

    await tx.orderItem.createMany({
      data: products.map((p) => ({
        orderId: order.id,
        productId: p.id,
        quantity: qtyById.get(p.id)!,
        price: asNumber(p.price),
      })),
    });

    // decrement stock atomically
    for (const p of products) {
      await tx.product.update({
        where: { id: p.id },
        data: { stock: { decrement: qtyById.get(p.id)! } },
      });
    }

    return tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });
  });

  // normalize number-like fields
  return {
    ...full,
    totalPrice: asNumber(full.totalPrice),
    items: full.items.map((it) => ({ ...it, price: asNumber(it.price) })),
  };
}

export async function listMyOrdersSvc(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { productId: true, quantity: true, price: true } },
    },
  });

  const num = (v: any) => (typeof v === "string" ? Number(v) : v);
  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    totalPrice: num(o.totalPrice),
    createdAt: o.createdAt,
    itemsCount: o.items.reduce((n, it) => n + it.quantity, 0),
  }));
}
