import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.js";
import { Router } from "express";

import authRoutes from "./modules/auth/auth.routes.js";
import productRoutes from "./modules/products/product.routes.js";
// import orderRoutes from "./modules/orders/order.routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
// app.use("/api/v1/orders", orderRoutes);

app.use(errorHandler);

export default app;
