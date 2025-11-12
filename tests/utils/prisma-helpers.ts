import { vi } from "vitest";

export function mockPrisma() {
  return {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
    },
    orderItem: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}
