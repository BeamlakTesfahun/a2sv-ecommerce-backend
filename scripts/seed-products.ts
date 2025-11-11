import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      //   {
      //     name: "Samsung S-23",
      //     description: "Flagship phone",
      //     price: 30000,
      //     stock: 5,
      //     category: "Mobile",
      //   },
      {
        name: "Samsung Galaxy Buds",
        description: "Wireless earbuds",
        price: 2999,
        stock: 20,
        category: "Audio",
      },
      {
        name: "Apple iPhone 15",
        description: "Latest iPhone",
        price: 45000,
        stock: 3,
        category: "Mobile",
      },
      {
        name: "Sandisk SSD 1TB",
        description: "Fast storage",
        price: 5999,
        stock: 12,
        category: "Storage",
      },
      {
        name: "Galaxy Tab S9",
        description: "Android tablet",
        price: 25000,
        stock: 7,
        category: "Tablet",
      },
    ],
  });
  console.log("Seeded sample products");
}

main().finally(() => prisma.$disconnect());
