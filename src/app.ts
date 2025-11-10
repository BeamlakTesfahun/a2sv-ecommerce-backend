import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.js";
// import authRoutes from "./modules/auth/auth.routes.js";
// import productRoutes from "./modules/products/product.routes.js";
// import orderRoutes from "./modules/orders/order.routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// app.use("/auth", authRoutes);
// app.use("/products", productRoutes);
// app.use("/orders", orderRoutes);

app.use(errorHandler);

export default app;
