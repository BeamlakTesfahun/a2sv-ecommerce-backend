import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";
import { upload } from "../../middlewares/upload.js";
import {
  createProduct,
  updateProduct,
  getProducts,
  getProduct,
  deleteProduct,
} from "./product.controller.js";

const router = Router();

// public
router.get("/", getProducts);
router.get("/:id", getProduct);

// admin-only
router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  createProduct
);
router.put("/:id", requireAuth, requireAdmin, updateProduct);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

export default router;
