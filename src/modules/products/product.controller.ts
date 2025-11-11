import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
} from "./product.schemas.js";
import {
  createProductSvc,
  updateProductSvc,
  deleteProductSvc,
  getProductOrThrowSvc,
  listProductsSvc,
} from "./product.service.js";
import { uploadImageBufferToCloudinary } from "../../libs/cloudinary.js";

const IdParam = z.object({ id: z.uuid() });

// CREATE ADMIN
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const dto = createProductSchema.parse(req.body);
    const file = (req as any).file as Express.Multer.File | undefined;

    const imageUrl = file
      ? await uploadImageBufferToCloudinary(file.buffer)
      : null;
    const created = await createProductSvc(dto, imageUrl);

    return res
      .status(201)
      .json({ success: true, message: "Product created", object: created });
  } catch (err: any) {
    if (err.name === "ZodError")
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues.map((i: any) => i.message),
      });
    next(err);
  }
}

// UPDATE ADMIN
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = IdParam.parse(req.params);
    const dto = updateProductSchema.parse(req.body);
    const updated = await updateProductSvc(id, dto);
    return res
      .status(200)
      .json({ success: true, message: "Product updated", object: updated });
  } catch (err: any) {
    if (err.name === "ZodError")
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues.map((i: any) => i.message),
      });
    next(err);
  }
}

// LIST (public)
export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { page, pageSize, search } = listProductsQuerySchema.parse(req.query);
    const opts = search ? { page, pageSize, search } : { page, pageSize };

    const { total, totalPages, products } = await listProductsSvc(opts);

    // decimal conversion
    const normalized = products.map((p: any) => ({
      ...p,
      price:
        typeof p.price === "object"
          ? parseFloat(p.price.toString())
          : typeof p.price === "string"
            ? parseFloat(p.price)
            : p.price,
    }));

    return res.status(200).json({
      success: true,
      message: "OK",
      currentPage: page,
      pageSize,
      totalPages,
      totalProducts: total,
      products: normalized,
    });
  } catch (err) {
    next(err);
  }
}

// DETAILS (public)
export async function getProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = IdParam.parse(req.params);
    const product = await getProductOrThrowSvc(id);
    return res
      .status(200)
      .json({ success: true, message: "OK", object: product });
  } catch (err) {
    next(err);
  }
}

// DELETE (admin)
export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = IdParam.parse(req.params);
    await deleteProductSvc(id);
    return res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
}
