// src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.js";
import {
  apiLimiter,
  TRUST_PROXY_VALUE,
  authLimiter,
  productsLimiter,
} from "./middlewares/rateLimit.js";

import authRoutes from "./modules/auth/auth.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";

const app = express();

// Safe default for local/tests
app.set("trust proxy", TRUST_PROXY_VALUE);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// global limiter
app.use(apiLimiter);

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/products", productsLimiter, productRoutes);
app.use("/api/v1/orders", orderRoutes);

app.use(errorHandler);

export default app;
